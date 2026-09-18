import { logger } from '@exogee/logger';
import {
	postgres as postgresDialect,
	moduleExport,
	type ConnectableDialect,
	type DriverConnection,
	type QueryResult,
	type Row,
	type SqlDriver,
	type PoolOptions,
	type SqlFragment,
} from '@exogee/graphweaver-sql';
import type { Pool, PoolClient, PoolConfig } from 'pg';
import { postgresMarshaller } from './marshal';

class PostgresDriver implements SqlDriver {
	readonly dialect = postgresDialect;
	readonly marshaller = postgresMarshaller;

	constructor(
		private readonly pool: Pool,
		readonly owned: boolean
	) {}

	async query<R = Row>({ text, params }: SqlFragment): Promise<QueryResult<R>> {
		const result = await this.pool.query({
			text,
			values: params.map((param) =>
				this.marshaller.toDatabase(param.value, param.type, param.meta)
			),
		});

		return { rows: result.rows as R[], rowCount: result.rowCount ?? result.rows.length };
	}

	/** Pins a client for a transaction. Every statement in it must run on the same connection. */
	async acquire(): Promise<DriverConnection> {
		const client: PoolClient = await this.pool.connect();

		return {
			query: async <R = Row>({ text, params }: SqlFragment): Promise<QueryResult<R>> => {
				const result = await client.query({
					text,
					values: params.map((p) => this.marshaller.toDatabase(p.value, p.type, p.meta)),
				});
				return { rows: result.rows as R[], rowCount: result.rowCount ?? result.rows.length };
			},
			release: () => client.release(),
		};
	}

	async destroy() {
		// Only ever tear down a pool we created.
		if (this.owned) await this.pool.end();
	}
}

export interface PostgresOptions extends PoolConfig {
	/**
	 * Pool sizing, spelled the same way on every dialect. Wins over `pg`'s own `min`/`max` below,
	 * which keep working for a config lifted from elsewhere.
	 *
	 * Postgres honours both halves: `pg-pool` keeps `min` clients alive rather than destroying them
	 * when they go idle.
	 */
	pool?: PoolOptions;

	/** `pg`'s own spelling. Prefer `pool` above. */
	max?: number;
	min?: number;
}

/** Defaults to a small pool, which suits a long running server rather than a Lambda. */
const poolSizing = (options: PostgresOptions) => ({
	max: options.pool?.max ?? options.max ?? 10,
	min: options.pool?.min ?? options.min ?? 0,
});

/** The Postgres dialect, with a `connect` on it. */
export type PostgresDialect = ConnectableDialect<typeof postgresDialect>;

const connectableWith = (open: () => Promise<Pool>, owned: boolean): PostgresDialect => ({
	...postgresDialect,
	connect: async () => {
		const pool = await open();

		// Fail at startup rather than on the first query.
		const probe = await pool.connect();
		probe.release();

		return new PostgresDriver(pool, owned);
	},
});

/** Creates (and owns) a connection pool. */
export const postgres = (options: PostgresOptions = {}): PostgresDialect =>
	connectableWith(async () => {
		const Pool = moduleExport<typeof import('pg').Pool>(await import('pg'), 'Pool');

		// `pool` is ours, not `pg`'s: passing it through would be ignored at best.
		const { pool: _pool, ...rest } = options;

		return new Pool({ ...rest, ...poolSizing(options) });
	}, true);

/**
 * Uses a pool you built yourself. We never call `end()` on it.
 *
 * This is the answer for Lambda warm-start reuse, RDS Proxy and pgBouncer, IAM auth where the
 * password is a token that expires, and any pool with its own instrumentation.
 */
postgres.fromPool = (pool: Pool): PostgresDialect => {
	logger.trace('Using a caller supplied Postgres pool; its lifecycle stays with the caller.');
	return connectableWith(async () => pool, false);
};
