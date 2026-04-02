import './utils/change-tracker';

import { AsyncLocalStorage } from 'node:async_hooks';
import {
	AnyEntity,
	Connection,
	EntityName,
	IDatabaseDriver,
	MikroORM,
	Options,
	ReflectMetadataProvider,
} from '@mikro-orm/core';
import { logger, safeErrorLog } from '@exogee/logger';

import type { EntityManager as PgEntityManager, PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { EntityManager as MyEntityManager, MySqlDriver } from '@mikro-orm/mysql';
import type { EntityManager as SqliteEntityManager, SqliteDriver } from '@mikro-orm/sqlite';
type EntityManager =
	| PgEntityManager<PostgreSqlDriver>
	| MyEntityManager<MySqlDriver>
	| SqliteEntityManager<SqliteDriver>;

export type DatabaseType = 'mssql' | 'mysql' | 'postgresql' | 'sqlite';

export interface ConnectionOptions {
	mikroOrmConfig?: Options | (() => Options | Promise<Options>);
	secretArn?: string;
	connectionManagerId?: string;
}

export enum IsolationLevel {
	SERIALIZABLE = 'SERIALIZABLE',
	REPEATABLE_READ = 'REPEATABLE READ',
	READ_COMMITTED = 'READ COMMITTED',
	READ_UNCOMMITTED = 'READ UNCOMMITTED',
}

const NumericIsolationLevels = {
	[IsolationLevel.SERIALIZABLE]: 4,
	[IsolationLevel.REPEATABLE_READ]: 3,
	[IsolationLevel.READ_COMMITTED]: 2,
	[IsolationLevel.READ_UNCOMMITTED]: 1,
};

export type Database = typeof DatabaseImplementation.prototype;

type TransactionalAsyncStore = {
	em: EntityManager;
	isolationLevel: IsolationLevel;
};

class DatabaseImplementation {
	private cachedOrm?: MikroORM<IDatabaseDriver<Connection>>;
	// Per-async-chain transactional em. This ensures we keep transactions isolated
	// and they don't mingle.
	private readonly transactionalAsyncLocal = new AsyncLocalStorage<TransactionalAsyncStore>();
	private connectionOptions?: ConnectionOptions;

	public get orm() {
		if (!this.cachedOrm) {
			const error = new Error('Tried to get the ORM before it was connected.');
			logger.error(error);
			throw error;
		}

		return this.cachedOrm;
	}

	public get em() {
		const tx = this.transactionalAsyncLocal.getStore();
		if (tx) return tx.em;
		return this.orm.em as EntityManager;
	}

	public async transactional<T>(
		callback: () => Promise<T>,
		isolationLevel: IsolationLevel = IsolationLevel.REPEATABLE_READ
	) {
		logger.trace('Database::transactional() enter');

		const current = this.transactionalAsyncLocal.getStore();

		if (
			current &&
			NumericIsolationLevels[current.isolationLevel] < NumericIsolationLevels[isolationLevel]
		) {
			const error = new Error(
				`Transaction in progress is ${current.isolationLevel} isolation level, but ${isolationLevel} was requested, which is more restrictive. Since we can't upgrade, this is an error.`
			);
			logger.error(error);
			throw error;
		}

		if (current) {
			// Same async chain already inside em.transactional — merge (savepoint / same Knex tx).
			logger.trace(
				'Transaction already in progress with sufficient isolation, proceeding without new transaction.'
			);

			return callback();
		}

		// New outer transaction — use root EM so we do not read transactionalAsyncLocal before it exists.
		logger.trace('Starting transaction');

		return this.orm.em.transactional(async (emArg) => {
			const em = emArg as EntityManager;
			const driver = em.getDriver();
			if (driver.constructor.name === 'SqliteDriver') {
				logger.trace('All transactions in SQLite are SERIALIZABLE');
			} else {
				await em.execute(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
			}

			return this.transactionalAsyncLocal.run({ em, isolationLevel }, async () => {
				let result: T;
				try {
					result = await callback();
				} catch (error) {
					safeErrorLog(logger, error, 'Error in transaction');
					throw error;
				}
				return result;
			});
		});
	}

	public isolatedTest(test: () => any) {
		return async () => {
			try {
				await this.transactional(async () => {
					await test();
					throw new Error('Rollback transaction for test');
				}, IsolationLevel.SERIALIZABLE);
			} catch (error) {
				// Only need to care if this isn't our rollback from above.
				// Otherwise just gobble it.
				if ((error as Error).message !== 'Rollback transaction for test') {
					throw error;
				}
			}
		};
	}

	public get rawConnection() {
		return this.em.getDriver().getConnection();
	}

	private getEnvironmentOverrides = async (secretArn?: string): Promise<Options> => {
		logger.trace('Database::getEnvironmentOverrides() - Enter');
		const secret = secretArn ?? process.env.DATABASE_SECRET_ARN;
		if (secret) {
			const { SecretsManagerClient, GetSecretValueCommand } = await import(
				'@aws-sdk/client-secrets-manager'
			);

			if (!SecretsManagerClient || !GetSecretValueCommand) {
				throw new Error(
					'SecretsManagerClient or GetSecretValueCommand not found but a secret ARN was provided. Is @aws-sdk/client-secrets-manager available?'
				);
			}

			const client = new SecretsManagerClient({
				region: process.env.AWS_REGION,
			});
			const command = new GetSecretValueCommand({ SecretId: secret });

			try {
				logger.trace('Fetching secret from Secrets Manager');
				const response = await client.send(command);
				const secret = JSON.parse(response.SecretString as string);
				logger.trace('Secret fetched from Secrets Manager');

				return {
					host: secret.host,
					port: secret.port,
					user: secret.username,
					password: secret.password,
					dbName: secret.dbname,
					driverOptions: {
						connection: { ssl: true },
					},
				};
			} catch (error) {
				logger.error('Error fetching secret from Secrets Manager');
				throw error;
			}
		}

		logger.trace('No secret ARN provided, using environment variables');

		return {
			host: process.env.DATABASE_HOST,
			port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
			user: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
			dbName: process.env.DATABASE_NAME,
		};
	};

	private getConnectionInfo = async (connectionOptions?: ConnectionOptions): Promise<Options> => {
		logger.trace('Database::getConnectionInfo() - Enter');

		// We have some defaults
		const defaults: Options = {
			host: 'localhost',
			port: 5432,
			dbName: 'graphweaver',
		};

		const resolvedMikroOrmConfig =
			typeof connectionOptions?.mikroOrmConfig === 'function'
				? await connectionOptions.mikroOrmConfig()
				: connectionOptions?.mikroOrmConfig;

		// And finally we can override all of this with environment variables if needed.
		const environmentOverrides = await this.getEnvironmentOverrides(connectionOptions?.secretArn);

		// Create a function we can use to filter out undefined values in the object.
		const filterUndefined = (obj?: Options) => {
			if (!obj) return {};

			for (const key of Object.keys(obj) as Array<keyof Options>) {
				if (obj[key] === undefined) delete obj[key];
			}

			return obj;
		};

		// Apply each in order so the correct value wins.
		return {
			...defaults,
			...filterUndefined(environmentOverrides),
			...filterUndefined(resolvedMikroOrmConfig),
		};
	};

	public getRepository = <T extends AnyEntity<T>>(entityName: EntityName<T>) =>
		this.em.getRepository(entityName);

	public connect = async (connectionOptions?: ConnectionOptions) => {
		logger.trace('Database::connect() - Enter');
		this.connectionOptions = connectionOptions;

		if (this.cachedOrm) {
			logger.trace('Returning cached ORM');
			return this.cachedOrm;
		}

		logger.trace('Creating new ORM');
		logger.trace('Getting connection info');

		const params = await this.getConnectionInfo(connectionOptions);

		logger.trace('Initialising ORM');

		logger.trace(`${params.entities?.length}x entities`);

		// Log the params, obfuscating the password used for the connection if there is one.
		const { password, ...rest } = params;
		logger.info(
			{ connectionParams: rest },
			'Connecting to database using MikroORM. Note: connectionParams have password removed for security.'
		);

		const orm = await MikroORM.init({
			validateRequired: false, // Since v5, new entities are validated on runtime (just before executing insert queries), based on the entity metadata
			contextName: connectionOptions?.connectionManagerId ?? 'default',
			implicitTransactions: false,
			metadataProvider: ReflectMetadataProvider,
			discovery: {
				disableDynamicFileAccess: true,
				requireEntitiesArray: false,
				warnWhenNoEntities: false,
			},
			allowGlobalContext: true,

			// Ensure we only ever create one connection to the database.
			pool: {
				min: 1,
				max: 1,
			},
			...params,
		});

		logger.trace({ dbName: params.dbName, host: params.host }, 'Creating database connection');
		await orm.connect();

		logger.trace('Caching connection');
		this.cachedOrm = orm;
		return orm;
	};

	public close = async () => {
		logger.trace('Closing database connection');

		await this.orm.close(true);
		delete this.cachedOrm;
	};
}

class ConnectionsManager {
	private connections = new Map<string, DatabaseImplementation>();
	private connectionPromises = new Map<string, Promise<DatabaseImplementation>>();

	getConnections() {
		return Array.from(this.connections.values());
	}

	get default(): DatabaseImplementation {
		const [defaultConnection] = [...this.connections];
		if (!defaultConnection)
			throw new Error(
				'Error: No database connections. There should be at least one database connection.'
			);
		const [_, databaseConnection] = defaultConnection;
		return databaseConnection;
	}

	public connect = (id: string, connectionOptions: ConnectionOptions) => {
		if (this.connections.has(id)) return this.connections.get(id);

		const connect = new Promise<DatabaseImplementation>((resolve, reject) => {
			const database = new DatabaseImplementation();
			database
				.connect(connectionOptions)
				.then(() => {
					logger.trace(`Saving database connection with id "${id}".`);
					this.connections.set(id, database);
					resolve(database);
				})
				.catch(reject);
		});

		this.connectionPromises.set(id, connect);

		return connect;
	};

	public database(id: string) {
		return this.connections.get(id);
	}

	public awaitableDatabase(id: string) {
		return this.connectionPromises.get(id);
	}

	public async close(id: string) {
		const database = this.database(id);
		await database?.close();
		return true;
	}
}
export const ConnectionManager = new ConnectionsManager();
