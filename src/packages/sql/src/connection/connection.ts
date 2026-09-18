import { logger } from '@exogee/logger';
import { IsolationLevel } from '../dialect/dialect';
import type { Dialect } from '../dialect/dialect';
import { namingStrategies, snakeCase } from '../mapping/naming';
import type { NamingStrategy, NamingStrategyName } from '../mapping/naming';
import type { SqlFragment } from '../compile/compiler';
import type { ConnectableDialect, QueryResult, Row, SqlDriver } from './driver';
import { currentTransaction, runInTransaction } from './transaction';
import type { RawQuery } from './raw';

export interface ConnectionOptions {
	/** Identifies this connection. Also what the provider reports as its `backendId`. */
	id: string;

	/** From a dialect package, e.g. `postgres({ ... })` or `sqlite.fromPool(db)`. */
	dialect: ConnectableDialect;

	/** Defaults to REPEATABLE READ, matching the MikroORM provider. */
	isolationLevel?: IsolationLevel;

	/**
	 * How entity and property names map onto tables and columns, for every entity on this
	 * connection. An individual provider can still override it.
	 */
	namingStrategy?: NamingStrategyName | NamingStrategy;
}

export class SqlConnection {
	readonly id: string;
	readonly isolationLevel: IsolationLevel;
	readonly namingStrategy: NamingStrategy;

	#dialect: ConnectableDialect;
	#driver?: SqlDriver;
	#connecting?: Promise<SqlDriver>;

	constructor(options: ConnectionOptions) {
		this.id = options.id;
		this.#dialect = options.dialect;
		this.isolationLevel = options.isolationLevel ?? IsolationLevel.REPEATABLE_READ;
		this.namingStrategy =
			typeof options.namingStrategy === 'string'
				? namingStrategies[options.namingStrategy]
				: (options.namingStrategy ?? snakeCase);
	}

	get dialect(): Dialect {
		return this.#dialect;
	}

	get connected() {
		return this.#driver !== undefined;
	}

	/** Idempotent, and safe to call concurrently: everyone awaits the same connect. */
	async connect(): Promise<SqlDriver> {
		if (this.#driver) return this.#driver;

		this.#connecting ??= this.#dialect.connect().then((driver) => {
			this.#driver = driver;
			return driver;
		});

		try {
			return await this.#connecting;
		} catch (error) {
			// Let the next caller try again rather than caching the failure forever.
			this.#connecting = undefined;
			throw error;
		}
	}

	/**
	 * The open driver, or a throw.
	 *
	 * Prefer `connect()` unless you are on a path that has already established the connection --
	 * there is no host we can rely on to have opened it for us. A Graphweaver app boots its
	 * providers long before it serves a request, a Lambda may cold start inside one, and a script
	 * or migration has no server at all.
	 */
	get driver(): SqlDriver {
		if (!this.#driver) {
			throw new Error(
				`Connection '${this.id}' is not open. Call connect() on it before reaching for the ` +
					`driver directly.`
			);
		}
		return this.#driver;
	}

	async query<R = Row>(fragment: SqlFragment): Promise<QueryResult<R>> {
		logger.trace({ sql: fragment.text }, 'Running SQL');

		// Inside a transaction every statement has to go to the pinned connection, or it will not
		// see the transaction's own uncommitted writes.
		const transaction = currentTransaction();
		if (transaction) return transaction.connection.query<R>(fragment);

		// `connect()` is idempotent and shares one in-flight promise, so this costs a resolved
		// promise per query once we are up.
		const driver = this.#driver ?? (await this.connect());
		return driver.query<R>(fragment);
	}

	/**
	 * Runs a raw query.
	 *
	 * The escape hatch for anything the filter grammar cannot say. Interpolations in the template
	 * become bound parameters, so this is safe by construction rather than by care:
	 *
	 *     const rows = await connection.raw(sql`
	 *       SELECT id FROM submission WHERE image->>'filename' = ${filename}
	 *     `);
	 *
	 * Rows come back exactly as the driver produced them -- no marshalling, no relationship
	 * hydration. To get entities back, take the ids from here and hand them to the provider.
	 */
	async raw<R = Row>(query: RawQuery): Promise<R[]> {
		const params = query.values.map((value, index) => ({
			value,
			type: query.types?.[index] ?? ('unknown' as const),
		}));

		const text = query.strings.reduce(
			(accumulated, part, index) =>
				index === 0
					? part
					: `${accumulated}${this.dialect.placeholder(index - 1, params[index - 1])}${part}`,
			''
		);

		const { rows } = await this.query<R>({ text, params });
		return rows;
	}

	async transactional<T>(callback: () => Promise<T>, isolationLevel?: IsolationLevel): Promise<T> {
		const driver = this.#driver ?? (await this.connect());
		return runInTransaction(driver, isolationLevel ?? this.isolationLevel, callback);
	}

	async close() {
		if (!this.#driver) return;
		await this.#driver.destroy();
		this.#driver = undefined;
		this.#connecting = undefined;
	}
}

const connections = new Map<string, SqlConnection>();

/**
 * Declares a connection. Constructing one does not open it -- the first query does, and everyone
 * who arrives while that is in flight waits on the same connect.
 *
 * A host that would rather find out about a bad connection string at boot than on the first
 * request can call `connectAllConnections()` during startup.
 */
export const defineConnection = (options: ConnectionOptions): SqlConnection => {
	const existing = connections.get(options.id);

	if (existing) {
		// Redeclaring the same connection is fine -- a module can be evaluated twice by a bundler
		// or a hot reload -- but redeclaring it *differently* is not. Handing back the first one
		// silently discards the second's options, and a discarded naming strategy does not fail:
		// it quietly reads every table and column under the wrong name.
		const wanted = new SqlConnection(options);

		if (
			wanted.namingStrategy.name !== existing.namingStrategy.name ||
			wanted.isolationLevel !== existing.isolationLevel
		) {
			throw new Error(
				`Connection '${options.id}' is already defined with a different configuration ` +
					`(naming strategy '${existing.namingStrategy.name}', isolation level ` +
					`'${existing.isolationLevel}'), and this call asks for naming strategy ` +
					`'${wanted.namingStrategy.name}' and isolation level '${wanted.isolationLevel}'. ` +
					`Give one of them a different id.`
			);
		}

		return existing;
	}

	const connection = new SqlConnection(options);
	connections.set(options.id, connection);
	return connection;
};

export const connectionById = (id: string) => connections.get(id);
export const allConnections = () => [...connections.values()];

/**
 * Opens every declared connection.
 *
 * Optional: connections open themselves on first use. This is for hosts that want a misconfigured
 * connection to fail at startup instead of on the first request that happens to touch it.
 */
export const connectAllConnections = async () => {
	await Promise.all(allConnections().map((connection) => connection.connect()));
};

export const closeAllConnections = async () => {
	await Promise.all(allConnections().map((connection) => connection.close()));
	connections.clear();
};
