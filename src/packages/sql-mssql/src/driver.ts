import { logger } from '@exogee/logger';
import {
	mssql as mssqlDialect,
	type BoundParam,
	type ConnectableDialect,
	type DriverConnection,
	type QueryResult,
	type Row,
	type SqlDriver,
	type PoolOptions,
	type SqlFragment,
} from '@exogee/graphweaver-sql';
import { Pool } from 'tarn';
import { Connection, Request, type ConnectionConfiguration } from 'tedious';
import { mssqlMarshaller } from './marshal';

/**
 * One statement on one connection, with every parameter carrying an explicit TDS type.
 *
 * A parameterless statement goes through `execSqlBatch` rather than `execSql`. `execSql` runs the
 * text inside `sp_executesql`, and SQL Server raises error 266 when a procedure returns with a
 * different transaction count than it started with -- so a `BEGIN TRANSACTION` issued that way
 * fails the moment anything follows it. Transaction control never carries parameters, so routing
 * parameterless statements through the raw batch path fixes it without giving up parameterisation
 * anywhere it matters.
 */
const execute = <R>(
	connection: Connection,
	{ text, params }: SqlFragment
): Promise<QueryResult<R>> =>
	new Promise((resolve, reject) => {
		const rows: R[] = [];

		const request = new Request(text, (error, rowCount) => {
			if (error) reject(error);
			else resolve({ rows, rowCount: rowCount ?? rows.length });
		});

		params.forEach((param: BoundParam, index) => {
			request.addParameter(
				`p${index}`,
				mssqlMarshaller.driverParameterType!(param.type, param.meta, param.value) as never,
				mssqlMarshaller.toDatabase(param.value, param.type, param.meta) as never
			);
		});

		// Rows arrive as column arrays, so flatten them into plain objects.
		request.on('row', (columns: { metadata: { colName: string }; value: unknown }[]) => {
			const row: Record<string, unknown> = {};
			for (const column of columns) row[column.metadata.colName] = column.value;
			rows.push(row as R);
		});

		if (params.length === 0) connection.execSqlBatch(request);
		else connection.execSql(request);
	});

/**
 * Connections we must not hand out again.
 *
 * tarn only asks `validate` whether a pooled connection is still good, and `closed` is not a good
 * enough answer: a session the server terminates stays `closed === false` until its socket finishes
 * closing, so there is a window where a dead connection looks fine. Borrowing one in that window
 * fails with "Requests can only be made in the LoggedIn state", which is a confusing way to be told
 * the connection died a moment ago.
 *
 * So the driver records the ones it saw fail at the transport level and `validate` consults this.
 */
const poisoned = new WeakSet<Connection>();

/**
 * Whether an error means the connection itself is finished, rather than the statement.
 *
 * A server-side SQL error -- a constraint violation, a syntax error -- carries a SQL error number
 * and leaves the connection perfectly usable, and throwing it away would mean a fresh TCP connect
 * and login for every rejected write. Anything without a number came from the transport.
 */
const isConnectionError = (error: unknown) =>
	typeof (error as { number?: unknown } | null)?.number !== 'number';

const connect = (config: ConnectionConfiguration) =>
	new Promise<Connection>((resolve, reject) => {
		const connection = new Connection(config);

		// A tedious Connection is an EventEmitter, and an EventEmitter that emits 'error' with
		// nothing listening throws it as an uncaught exception -- which takes the process with it.
		// So a failover, an idle timeout or a server restart would kill the whole Graphweaver app
		// rather than costing it one pooled connection. Listening is what makes it survivable; the
		// connection itself is finished either way, so retire it.
		connection.on('error', (error) => {
			poisoned.add(connection);
			logger.warn({ error }, 'Lost a SQL Server connection.');
			reject(error);
		});

		connection.on('connect', (error) => (error ? reject(error) : resolve(connection)));
		connection.connect();
	});

class MssqlDriver implements SqlDriver {
	readonly dialect = mssqlDialect;
	readonly marshaller = mssqlMarshaller;

	constructor(
		private readonly pool: Pool<Connection>,
		readonly owned: boolean
	) {}

	async query<R = Row>(fragment: SqlFragment): Promise<QueryResult<R>> {
		const connection = await this.pool.acquire().promise;

		try {
			return await execute<R>(connection, fragment);
		} catch (error) {
			if (isConnectionError(error)) poisoned.add(connection);
			throw error;
		} finally {
			this.pool.release(connection);
		}
	}

	async acquire(): Promise<DriverConnection> {
		const connection = await this.pool.acquire().promise;

		// tedious carries one request per connection and throws "Requests can only be made in the
		// LoggedIn state" if a second starts before the first finishes. `pg` and `mysql2` queue
		// internally, so nothing above the driver knows it has to take turns -- and core does not:
		// it resolves a batched write's rows concurrently, and they all land on this one pinned
		// connection. So the queue lives here.
		let queue: Promise<unknown> = Promise.resolve();

		const serialise = <T>(work: () => Promise<T>): Promise<T> => {
			const result = queue.then(work, work);

			// The chain must not inherit a rejection, or one failed statement would fail every
			// statement queued behind it.
			queue = result.catch(() => undefined);

			return result;
		};

		return {
			query: <R>(fragment: SqlFragment) =>
				serialise(() =>
					execute<R>(connection, fragment).catch((error) => {
						if (isConnectionError(error)) poisoned.add(connection);
						throw error;
					})
				),
			release: () => {
				// Anything still queued has to finish before the connection goes back, or it would
				// be reset and handed to someone else mid-statement.
				void serialise(async () => {
					// SET TRANSACTION ISOLATION LEVEL is connection sticky on SQL Server, unlike the
					// other three, so a connection has to be reset before the next borrower sees it.
					// A reset that fails leaves the isolation level behind, so the connection cannot be
					// reused whatever the reason was.
					try {
						connection.reset((error) => {
							if (error) {
								logger.warn({ error }, 'Failed to reset a SQL Server connection.');
								poisoned.add(connection);
							}
							this.pool.release(connection);
						});
					} catch (error) {
						logger.warn({ error }, 'Could not reset a SQL Server connection.');
						poisoned.add(connection);
						this.pool.release(connection);
					}
				});
			},
		};
	}

	async destroy() {
		if (this.owned) await this.pool.destroy();
	}
}

export interface MssqlOptions {
	/**
	 * The server to connect to.
	 *
	 * `host` is what every other dialect calls it and what `graphweaver import` writes; `server` is
	 * tedious' own spelling, kept so a config lifted from elsewhere in the SQL Server ecosystem
	 * works unchanged. Give one or the other -- `server` wins if you somehow give both.
	 */
	host?: string;
	server?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
	domain?: string;
	instanceName?: string;
	encrypt?: boolean;
	trustServerCertificate?: boolean;
	/**
	 * Pool sizing, spelled the same way on every dialect. tarn honours both halves.
	 */
	pool?: PoolOptions;
	/** Anything else tedious understands, merged last. */
	options?: Record<string, unknown>;
}

/** The SQL Server dialect, with a `connect` on it. */
export type MssqlDialect = ConnectableDialect<typeof mssqlDialect>;

const configFor = (options: MssqlOptions): ConnectionConfiguration => ({
	server: options.server ?? options.host ?? 'localhost',
	authentication: {
		type: 'default',
		options: { userName: options.user, password: options.password, domain: options.domain },
	},
	options: {
		port: options.port ?? 1433,
		database: options.database,
		instanceName: options.instanceName,
		encrypt: options.encrypt ?? true,
		trustServerCertificate: options.trustServerCertificate ?? false,
		// All date handling belongs to the marshaller, so keep the driver on UTC.
		useUTC: true,
		enableArithAbort: true,
		rowCollectionOnRequestCompletion: false,
		...options.options,
	},
});

const connectableWith = (open: () => Promise<Pool<Connection>>, owned: boolean): MssqlDialect => ({
	...mssqlDialect,
	connect: async () => new MssqlDriver(await open(), owned),
});

/**
 * Creates (and owns) a pool.
 *
 * `tarn` around `tedious` rather than the `mssql` wrapper: that package keeps a process-global
 * pool, which fights having several independent connections, and it hides the parameter typing we
 * need to get decimals right.
 */
export const mssql = (options: MssqlOptions = {}): MssqlDialect =>
	connectableWith(async () => {
		const config = configFor(options);

		return new Pool<Connection>({
			create: () => connect(config),
			destroy: (connection) => {
				connection.close();
				return Promise.resolve();
			},
			validate: (connection) => !connection.closed && !poisoned.has(connection),
			min: options.pool?.min ?? 0,
			max: options.pool?.max ?? 10,
		});
	}, true);

/** Uses a tarn pool of tedious connections you built yourself. We never destroy it. */
mssql.fromPool = (pool: Pool<Connection>): MssqlDialect => connectableWith(async () => pool, false);
