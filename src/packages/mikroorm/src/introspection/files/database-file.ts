import { Options } from '@mikro-orm/core';
import { ConnectionOptions, DatabaseType } from '../../database';

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
		const isPostgresql = this.databaseType === 'postgresql';
		const isMySQL = this.databaseType === 'mysql';
		const isSQLite = this.databaseType === 'sqlite';
		const imports = [
			...(isPostgresql ? [`import { PostgreSqlDriver } from '@mikro-orm/postgresql';`] : []),
			...(isMySQL ? [`import { MySqlDriver } from '@mikro-orm/mysql';`] : []),
			...(isSQLite ? [`import { SqliteDriver } from 'mikro-orm-sqlite-wasm';`] : []),
			`import { entities } from './entities';`,
		];
		const exports = [`export const connections = [connection];`];

		const pad = '\t';

		const config = this.connection.mikroOrmConfig as Options;

		const connection = [`export const connection = {`];
		connection.push(`${pad}connectionManagerId: '${this.databaseType}',`);
		connection.push(`${pad}mikroOrmConfig: {`);
		connection.push(`${pad}${pad}entities,`);
		connection.push(
			`${pad}${pad}driver: ${
				isPostgresql ? 'PostgreSqlDriver' : isMySQL ? 'MySqlDriver' : 'SqliteDriver'
			},`
		);
		connection.push(`${pad}${pad}dbName: process.env.DATABASE_NAME || '${config.dbName}',`);
		if (!isSQLite) {
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
