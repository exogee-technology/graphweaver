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
import { EntityManager, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { logger } from '@exogee/logger';
//import AWS from 'aws-sdk';

export interface ConnectionOptions {
	mikroOrmConfig?: Options;
	secretArn?: string;
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
		return (this.transactionalEm || this.orm.em) as EntityManager<PostgreSqlDriver>;
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
				await em.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
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
			driver: PostgreSqlDriver,
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

export const Database = new DatabaseImplementation();

export const checkDatabase = async () => {
	await Database.connect();
	const rows = await Database.rawConnection.execute('select 1 = 1 as "ok";');
	return rows[0].ok;
};

export const getDbSchema = async () => {
	await Database.connect();
	const result = (await Database.orm.getSchemaGenerator().generate())
		.replace("set names 'utf8';\n", '')
		.replace("set session_replication_role = 'replica';\n", '')
		.replace("set session_replication_role = 'origin';\n", '');
	await Database.close();
	return result;
};

export const clearDatabaseContext = async (
	req?: any,
	res?: any,
	next?: any,
	connectionOptions?: ConnectionOptions
) => {
	await Database.connect(connectionOptions);
	Database.em.clear();
	return next ? next() : undefined;
};
