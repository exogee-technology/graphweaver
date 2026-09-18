import type { Dialect } from '../dialect/dialect';
import type { SqlFragment } from '../compile/compiler';
import type { Marshaller } from '../marshal/marshaller';

export type Row = Record<string, unknown>;

/**
 * How many connections a dialect may hold open.
 *
 * Every dialect accepts this, spelled the same way, because the setting that matters most is the
 * one people copy between projects: a Lambda wants `{ min: 1, max: 1 }` -- one connection per warm
 * container, since each handles one request at a time and a few hundred containers at ten
 * connections each will exhaust a database long before the code does. It is also the spelling the
 * MikroORM configuration used, so a migrating project moves the line across unchanged.
 *
 * Each driver's own spelling still works and this wins where both are given. Not every driver
 * implements both halves -- see the dialect packages, which say what they can honour.
 */
export interface PoolOptions {
	/** Connections to keep open when idle. */
	min?: number;
	/** The ceiling. Defaults to 10, which suits a long running server rather than a Lambda. */
	max?: number;
}

export interface QueryResult<R = Row> {
	rows: R[];
	rowCount: number;
	/** Only populated by dialects whose insert key strategy is `insertId` (MySQL). */
	insertId?: string | number | bigint;
}

/** A connection pinned out of the pool, which is what a transaction runs on. */
export interface DriverConnection {
	query<R = Row>(fragment: SqlFragment): Promise<QueryResult<R>>;
	release(): void | Promise<void>;
}

export interface SqlDriver {
	readonly dialect: Dialect;

	/** Value conversion is a driver concern: each one is wrong in its own way by default. */
	readonly marshaller: Marshaller;

	/**
	 * Whether we created the underlying pool. `destroy` must tear down a pool we made and must not
	 * touch one we were handed -- getting this wrong either leaks a pool on shutdown or closes
	 * somebody else's out from under them.
	 */
	readonly owned: boolean;

	/** Runs on a pooled connection, or on the ambient transaction's connection if there is one. */
	query<R = Row>(fragment: SqlFragment): Promise<QueryResult<R>>;

	/** Pins a connection for the life of a transaction. */
	acquire(): Promise<DriverConnection>;

	destroy(): Promise<void>;
}

/**
 * A dialect that can also open a connection, which is what a dialect package's factory returns.
 * `postgres({ ... })` and `postgres.fromPool(pool)` both produce one; the difference is only what
 * `connect` does and what `owned` ends up as.
 *
 * The `Dialect` in this package is pure string logic -- quoting, placeholders, pagination -- with no
 * dependencies at all, which is what lets the golden SQL tests compile all four dialects on a
 * machine with no driver installed. A dialect package composes one of those with its own `connect`
 * rather than wrapping it, so there is one object here rather than a dialect inside a binding.
 * `connect` cannot live on `Dialect` itself: this package must not know that `pg` exists.
 */
export type ConnectableDialect<D extends Dialect = Dialect> = D & {
	connect(): Promise<SqlDriver>;
};

export { moduleExport } from './interop';
