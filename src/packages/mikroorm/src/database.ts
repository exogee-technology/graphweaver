import 'reflect-metadata';
import './utils/change-tracker';

import {
	AnyEntity,
	Connection,
	EntityName,
	IDatabaseDriver,
	MikroORM,
	Options,
	ReflectMetadataProvider,
} from '@mikro-orm/core';
import { logger } from '@exogee/logger';

import type { EntityManager as PgEntityManager, PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { EntityManager as MyEntityManager, MySqlDriver } from '@mikro-orm/mysql';
type EntityManager = PgEntityManager<PostgreSqlDriver> | MyEntityManager<MySqlDriver>;

export interface ConnectionOptions {
	mikroOrmConfig?: Options;
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

class DatabaseImplementation {
	private cachedOrm?: MikroORM<IDatabaseDriver<Connection>>;
	private transactionalEm?: EntityManager;
	private transactionInProgressIsolationLevel?: IsolationLevel;

	public get orm() {
		if (!this.cachedOrm) {
			const error = new Error('Tried to get the ORM before it was connected.');
			logger.error(error);
			throw error;
		}

		return this.cachedOrm;
	}

	public get em() {
		return this.transactionalEm || (this.orm.em as EntityManager);
	}

	public async transactional<T>(
		callback: () => Promise<T>,
		isolationLevel: IsolationLevel = IsolationLevel.READ_COMMITTED
	) {
		logger.trace('Database::transactional() enter');

		if (
			this.transactionInProgressIsolationLevel &&
			NumericIsolationLevels[this.transactionInProgressIsolationLevel] <
				NumericIsolationLevels[isolationLevel]
		) {
			const error = new Error(
				`Transaction in progress is ${this.transactionInProgressIsolationLevel} isolation level, but ${isolationLevel} was requested, which is more restrictive. Since we can't upgrade, this is an error.`
			);
			logger.error(error);
			throw error;
		}

		if (this.transactionalEm) {
			// Transaction is already in progress that is isolated enough. Run the callback without starting a new one.
			logger.trace(
				'Transaction already in progress with sufficient isolation, proceeding without new transaction.'
			);

			return callback();
		} else {
			// Ok, start a new one.
			logger.trace('Starting transaction');

			return this.em.transactional(async (em) => {
				this.transactionalEm = em;
				this.transactionInProgressIsolationLevel = isolationLevel;
				await em.execute(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
				let result: T;
				try {
					result = await callback();
				} finally {
					delete this.transactionalEm;
					delete this.transactionInProgressIsolationLevel;
				}
				return result;
			});
		}
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

	private getConnectionInfo = async (connectionOptions?: ConnectionOptions): Promise<Options> => {
		logger.trace('Database::getConnectionInfo() - Enter');

		// We have some defaults
		const defaults: Options = {
			host: 'localhost',
			port: 5432,
			dbName: 'graphweaver',
		};

		// If we've been passed a secret then we need to get all this
		// info from Secrets Manager.
		/* let secret = {};
		const secretArn = connectionOptions?.secretArn || process.env.DATABASE_SECRET_ARN;

		if (secretArn) {
			const SecretsManager = new AWS.SecretsManager();
			logger.trace('Fetching database connection info from Secrets Manager');

			const result = await SecretsManager.getSecretValue({
				SecretId: secretArn,
			}).promise();

			logger.trace('Got result from Secrets Manager');

			if (result.SecretString) {
				logger.trace('Parsing result');

				// We only want certain properties from this secret.
				const { host, port, username: user, password, dbname: dbName } = JSON.parse(
					result.SecretString
				) as {
					host: string;
					port: number;
					username: string;
					password: string;
					dbname: string;
				};

				secret = { host, port, user, password, dbName };
			}
		} */

		// And finally we can override all of this with environment variables if needed.
		const environmentOverrides: Options = {
			host: process.env.DATABASE_HOST,
			port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : undefined,
			user: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
			dbName: process.env.DATABASE_NAME,
		};

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
			//...filterUndefined(secret),
			...filterUndefined(environmentOverrides),
			...filterUndefined(connectionOptions?.mikroOrmConfig),
		};
	};

	public getRepository = <T extends AnyEntity<T>>(entityName: EntityName<T>) =>
		this.em.getRepository(entityName);

	public connect = async (connectionOptions?: ConnectionOptions) => {
		logger.trace('Database::connect() - Enter');

		if (this.cachedOrm) {
			logger.trace('Returning cached ORM');
			return this.cachedOrm;
		}

		logger.trace('Creating new ORM');
		logger.trace('Getting connection info');
		const params = await this.getConnectionInfo(connectionOptions);

		logger.trace('Initialising ORM');

		logger.trace(`${params.entities?.length}x entities`);

		const orm = await MikroORM.init({
			validateRequired: false, // Since v5, new entities are validated on runtime (just before executing insert queries), based on the entity metadata

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

		logger.trace('Creating connection to %s on %s', params.dbName, params.host);
		await orm.connect();

		logger.trace('Caching connection');
		this.cachedOrm = orm;
		return orm;
	};

	public close = async () => {
		logger.trace('Closing database connection');

		await this.orm.close();
		delete this.cachedOrm;
	};
}

class ConnectionsManager {
	private connections: Map<string, DatabaseImplementation>;

	constructor() {
		this.connections = new Map<string, DatabaseImplementation>();
	}

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

	public connect = async (id: string, connectionOptions?: ConnectionOptions) => {
		if (this.connections.has(id)) return this.connections.get(id);
		const database = new DatabaseImplementation();
		if (connectionOptions) await database.connect(connectionOptions);
		logger.trace(`Saving database connection with id "${id}".`);
		this.connections.set(id, database);
	};

	public database(id: string) {
		logger.trace(`Finding database connection for id "${id}"`);
		return this.connections.get(id);
	}
}
export const ConnectionManager = new ConnectionsManager();
