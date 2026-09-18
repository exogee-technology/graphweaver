import { logger } from '@exogee/logger';
import {
	sqlite as sqliteDialect,
	moduleExport,
	type ConnectableDialect,
	type DriverConnection,
	type QueryResult,
	type Row,
	type SqlDriver,
	type PoolOptions,
	type SqlFragment,
} from '@exogee/graphweaver-sql';
import type { Database } from 'node-sqlite3-wasm';
import { sqliteMarshaller } from './marshal';

/** Statements that hand rows back, as opposed to ones we only want a row count from. */
const RETURNS_ROWS = /^\s*(select|with|pragma)\b/i;
const HAS_RETURNING = /\breturning\b/i;

/**
 * node-sqlite3-wasm is a single synchronous handle, not a pool.
 *
 * Everything therefore has to be serialised through one promise chain. Our own code awaits between
 * statements inside a transaction, so without this two concurrent transactions would interleave
 * their statements on the same handle and corrupt each other. The honest concurrency ceiling here
 * is one, which is the same as the MikroORM provider's hardcoded `pool: { min: 1, max: 1 }` -- the
 * difference is that here it is deliberate rather than incidental.
 */
class SqliteDriver implements SqlDriver {
	readonly dialect = sqliteDialect;
	readonly marshaller = sqliteMarshaller;

	#queue: Promise<unknown> = Promise.resolve();
	#supportsReturning = true;

	constructor(
		private readonly database: Database,
		readonly owned: boolean
	) {}

	static async open(database: Database, owned: boolean) {
		const driver = new SqliteDriver(database, owned);

		database.run('PRAGMA foreign_keys = ON');

		// RETURNING needs SQLite 3.35. The wasm build is well past that, but a caller can hand us
		// their own handle from anywhere, so ask rather than assume.
		try {
			database.exec('CREATE TEMP TABLE _gw_returning_probe (id INTEGER PRIMARY KEY)');
			database.run('INSERT INTO _gw_returning_probe (id) VALUES (1) RETURNING id');
			database.exec('DROP TABLE _gw_returning_probe');
		} catch {
			driver.#supportsReturning = false;
			logger.warn('This SQLite build has no RETURNING support; falling back to re-selects.');
		}

		return driver;
	}

	get supportsReturning() {
		return this.#supportsReturning;
	}

	/** Serialises onto the single handle, and keeps the chain alive when a statement throws. */
	#serialise<T>(work: () => T): Promise<T> {
		const result = this.#queue.then(work, work);
		this.#queue = result.catch(() => undefined);
		return result;
	}

	async query<R = Row>({ text, params }: SqlFragment): Promise<QueryResult<R>> {
		return this.#serialise(() => {
			const values = params.map(
				(param) =>
					this.marshaller.toDatabase(param.value, param.type, param.meta) as
						string | number | bigint | Uint8Array | null
			);

			if (RETURNS_ROWS.test(text) || HAS_RETURNING.test(text)) {
				const rows = this.database.all(text, values) as R[];
				return { rows, rowCount: rows.length };
			}

			const { changes, lastInsertRowid } = this.database.run(text, values);
			return { rows: [] as R[], rowCount: changes, insertId: lastInsertRowid };
		});
	}

	/**
	 * There is only one connection, so a transaction "pins" the handle it was always going to use.
	 * The serialisation queue is what actually keeps other work from interleaving.
	 */
	async acquire(): Promise<DriverConnection> {
		return {
			query: (fragment) => this.query(fragment),
			release: () => undefined,
		};
	}

	async destroy() {
		// Never close a handle somebody else opened and still owns.
		if (this.owned && this.database.isOpen) this.database.close();
	}
}

export interface SqliteOptions {
	/** Omit for an in-memory database. */
	filename?: string;
	fileMustExist?: boolean;
	readOnly?: boolean;

	/**
	 * Accepted so that one pool setting can be written the same way across every connection in a
	 * project, but SQLite is a single synchronous in-process handle: there is nothing to size, and
	 * the effective pool is always one. `{ min: 1, max: 1 }` therefore describes it exactly, and
	 * asking for more is a misunderstanding worth a warning rather than a silent no-op.
	 */
	pool?: PoolOptions;
}

const warnAboutPoolSize = (pool: PoolOptions | undefined) => {
	if (pool?.max !== undefined && pool.max > 1) {
		logger.warn(
			`SQLite runs on one in-process handle, so pool.max of ${pool.max} cannot be honoured; ` +
				`queries are serialised through a single connection regardless.`
		);
	}
};

/** The Sqlite dialect, with a `connect` on it. */
export type SqliteDialect = ConnectableDialect<typeof sqliteDialect>;

const connectableWith = (open: () => Promise<Database>, owned: boolean): SqliteDialect => ({
	...sqliteDialect,
	connect: async () => SqliteDriver.open(await open(), owned),
});

/** Opens (and owns) a SQLite database. */
export const sqlite = (options: SqliteOptions = {}): SqliteDialect =>
	connectableWith(async () => {
		warnAboutPoolSize(options.pool);

		const Database = moduleExport<typeof import('node-sqlite3-wasm').Database>(
			await import('node-sqlite3-wasm'),
			'Database'
		);

		return new Database(options.filename ?? ':memory:', {
			fileMustExist: options.fileMustExist,
			readOnly: options.readOnly,
		});
	}, true);

/**
 * Uses a database handle you opened yourself. We never close it.
 *
 * This is the escape hatch for anything whose lifecycle genuinely is not ours: a handle shared
 * across an integration test suite, or one opened with options we do not expose.
 */
sqlite.fromDatabase = (database: Database): SqliteDialect =>
	connectableWith(async () => database, false);
