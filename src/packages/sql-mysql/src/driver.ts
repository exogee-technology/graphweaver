import { logger } from '@exogee/logger';
import {
	mysql as mysqlDialect,
	moduleExport,
	type ConnectableDialect,
	type DriverConnection,
	type QueryResult,
	type Row,
	type SqlDriver,
	type PoolOptions,
	type SqlFragment,
} from '@exogee/graphweaver-sql';
import type {
	Pool,
	PoolConnection,
	PoolOptions as Mysql2PoolOptions,
	ResultSetHeader,
	RowDataPacket,
} from 'mysql2/promise';
import { mysqlMarshaller } from './marshal';

/**
 * Settings the driver cannot work correctly without.
 *
 * `supportBigNumbers` and `bigNumberStrings` together are the difference between a bigint round
 * tripping and silently losing precision past 2^53. `dateStrings` and `timezone` take date parsing
 * away from the driver so the marshaller can do it in UTC. `multipleStatements` stays off because
 * turning it on widens the blast radius of any injection bug to a whole script.
 */
const REQUIRED: Mysql2PoolOptions = {
	supportBigNumbers: true,
	bigNumberStrings: true,
	dateStrings: true,
	timezone: 'Z',
	decimalNumbers: false,
	multipleStatements: false,
};

/**
 * Runs a statement, choosing between MySQL's two wire protocols.
 *
 * `execute` prepares the statement, which is what we want for anything carrying values -- it is
 * what makes the parameters actually parameters. But MySQL's prepared statement protocol does not
 * support every command: `START TRANSACTION`, `COMMIT`, `ROLLBACK` and
 * `SET TRANSACTION ISOLATION LEVEL` all fail with "This command is not supported in the prepared
 * statement protocol yet". Those never carry parameters, so routing parameterless statements
 * through the text protocol handles them without weakening anything.
 */
const run = async (
	target: Pick<Pool, 'query' | 'execute'>,
	{ text, params }: SqlFragment
): Promise<unknown> => {
	if (params.length === 0) {
		const [rows] = await target.query(text);
		return rows;
	}

	const [rows] = await target.execute(
		text,
		params.map((param) => mysqlMarshaller.toDatabase(param.value, param.type, param.meta))
	);
	return rows;
};

const toResult = <R>(rows: unknown): QueryResult<R> => {
	// A SELECT gives an array of rows; everything else gives a header.
	if (Array.isArray(rows)) {
		return { rows: rows as R[], rowCount: (rows as RowDataPacket[]).length };
	}

	const header = rows as ResultSetHeader;
	return {
		rows: [] as R[],
		rowCount: header.affectedRows ?? 0,
		insertId: header.insertId,
	};
};

class MysqlDriver implements SqlDriver {
	readonly dialect = mysqlDialect;
	readonly marshaller = mysqlMarshaller;

	constructor(
		private readonly pool: Pool,
		readonly owned: boolean
	) {}

	async query<R = Row>(fragment: SqlFragment): Promise<QueryResult<R>> {
		return toResult<R>(await run(this.pool, fragment));
	}

	async acquire(): Promise<DriverConnection> {
		const connection: PoolConnection = await this.pool.getConnection();

		return {
			query: async <R = Row>(fragment: SqlFragment): Promise<QueryResult<R>> =>
				toResult<R>(await run(connection, fragment)),
			release: () => connection.release(),
		};
	}

	async destroy() {
		if (this.owned) await this.pool.end();
	}
}

export interface MysqlOptions extends Mysql2PoolOptions {
	/**
	 * Pool sizing, spelled the same way on every dialect. Wins over `connectionLimit` below, which
	 * keeps working for a config lifted from elsewhere.
	 *
	 * `max` maps to `connectionLimit`. `min` has no equivalent: mysql2 opens connections on demand
	 * and has no minimum pool size, so it is accepted for symmetry -- a Lambda config of
	 * `{ min: 1, max: 1 }` copies across unchanged -- and only `max` does anything. Idle
	 * connections are kept regardless, up to `maxIdle` and `idleTimeout`, so a warm container does
	 * not reconnect per request.
	 */
	pool?: PoolOptions;
}

/** Defaults to a small pool, which suits a long running server rather than a Lambda. */
const connectionLimit = (options: MysqlOptions) =>
	options.pool?.max ?? options.connectionLimit ?? 10;

/** The Mysql dialect, with a `connect` on it. */
export type MysqlDialect = ConnectableDialect<typeof mysqlDialect>;

const connectableWith = (open: () => Promise<Pool>, owned: boolean): MysqlDialect => ({
	...mysqlDialect,
	connect: async () => new MysqlDriver(await open(), owned),
});

/** Creates (and owns) a connection pool, with the settings above forced on. */
export const mysql = (options: MysqlOptions = {}): MysqlDialect =>
	connectableWith(async () => {
		const createPool = moduleExport<typeof import('mysql2/promise').createPool>(
			await import('mysql2/promise'),
			'createPool'
		);

		// `pool` is ours, not mysql2's, so it must not reach createPool.
		const { pool: _pool, ...rest } = options;

		return createPool({ ...rest, connectionLimit: connectionLimit(options), ...REQUIRED });
	}, true);

/**
 * Uses a pool you built yourself. We never call `end()` on it.
 *
 * Unlike the other dialects this one checks what it was handed. Every setting in REQUIRED is a
 * correctness issue rather than a preference, and the bigint ones fail silently -- you get numbers
 * that are subtly wrong rather than an error -- so it is worth refusing up front.
 */
mysql.fromPool = (pool: Pool): MysqlDialect =>
	connectableWith(async () => {
		const config = (pool as unknown as { config?: { connectionConfig?: Record<string, unknown> } })
			.config?.connectionConfig;

		if (config) {
			const wrong = Object.entries(REQUIRED).filter(([key, value]) => config[key] !== value);

			if (wrong.length) {
				throw new Error(
					`The MySQL pool passed to mysql.fromPool is missing settings this driver needs: ` +
						`${wrong.map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(', ')}. ` +
						`Without them bigints lose precision and dates shift timezone, both silently.`
				);
			}
		} else {
			logger.warn(
				'Could not read the configuration of the supplied MySQL pool, so its settings were ' +
					'not checked. Make sure supportBigNumbers, bigNumberStrings, dateStrings and ' +
					"timezone: 'Z' are all set."
			);
		}

		return pool;
	}, false);
