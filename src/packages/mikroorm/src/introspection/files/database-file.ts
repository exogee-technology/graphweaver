import { Options } from '@mikro-orm/core';
import { ConnectionOptions, DatabaseType } from '../../database';

const pad = '\t';

const importLineForDatabaseType = (databaseType: DatabaseType) => {
	const packageName =
		databaseType === 'sqlite' ? 'mikro-orm-sqlite-wasm' : `@mikro-orm/${databaseType}`;

	return `import { ${driverForDatabaseType(databaseType)} } from '${packageName}';`;
};

const driverForDatabaseType = (databaseType: DatabaseType) => {
	if (databaseType === 'mssql') return 'MsSqlDriver';
	if (databaseType === 'mysql') return 'MySqlDriver';
	if (databaseType === 'postgresql') return 'PostgreSqlDriver';
	if (databaseType === 'sqlite') return 'SqliteDriver';

	throw new Error(`Unsupported database type: ${databaseType}`);
};

export class DatabaseFile {
	constructor(
		protected readonly databaseType: DatabaseType,
		protected readonly connection: ConnectionOptions
	) {}

	getBasePath() {
		return `backend/`;
	}

	getBaseName() {
		return 'database.ts';
	}

	generate(): string {
		const imports = [
			importLineForDatabaseType(this.databaseType),
			`import { entities } from './entities';`,
		];

		const exports = [`export const connections = [connection];`];

		const config = this.connection.mikroOrmConfig as Options;

		const connection = [`export const connection = {`];
		connection.push(`${pad}connectionManagerId: '${this.databaseType}',`);
		connection.push(`${pad}mikroOrmConfig: {`);
		connection.push(`${pad}${pad}entities,`);
		connection.push(`${pad}${pad}driver: ${driverForDatabaseType(this.databaseType)},`);
		connection.push(`${pad}${pad}dbName: process.env.DATABASE_NAME || '${config.dbName}',`);
		if (this.databaseType !== 'sqlite') {
			connection.push(`${pad}${pad}host: process.env.DATABASE_HOST || '${config.host}',`);
			connection.push(`${pad}${pad}user: process.env.DATABASE_USER || '${config.user}',`);
			connection.push(
				`${pad}${pad}password: process.env.DATABASE_PASSWORD || '${config.password}',`
			);
			connection.push(
				`${pad}${pad}port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : ${config.port},`
			);
		}
		connection.push(`${pad}},`);
		connection.push(`};`);

		return `${imports.join('\n')}\n\n${connection.join('\n')}\n\n${exports.join('\n')}\n`;
	}
}
