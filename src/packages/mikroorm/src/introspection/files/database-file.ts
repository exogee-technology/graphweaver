import { Options } from '@mikro-orm/core';
import { ConnectionOptions, DatabaseType } from '../../database';

export class DatabaseFile {
	constructor(
		protected readonly type: DatabaseType,
		protected readonly connection: ConnectionOptions
	) {}

	getBasePath() {
		return `backend/`;
	}

	getBaseName() {
		return 'database.ts';
	}

	generate(): string {
		const isPostgresql = this.type === 'postgresql';
		const imports = [
			...(isPostgresql
				? [`import { PostgreSqlDriver } from '@mikro-orm/postgresql';`]
				: [`import { MySqlDriver } from '@mikro-orm/mysql';`]),
			`import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';`,
			`import { entities } from './entities';`,
		];
		const exports = [
			`export const connections = [connection];`,
			`export const plugins = [connectToDatabase(connection), ClearDatabaseContext];`,
		];

		const pad = '\t';

		const config = this.connection.mikroOrmConfig as Options;

		const connection = [`export const connection = {`];
		connection.push(`${pad}connectionManagerId: '${this.type}',`);
		connection.push(`${pad}mikroOrmConfig: {`);
		connection.push(`${pad}${pad}entities: entities,`);
		connection.push(`${pad}${pad}driver: ${isPostgresql ? 'PostgreSqlDriver' : 'MySqlDriver'},`);
		connection.push(`${pad}${pad}dbName: '${config.dbName}',`);
		connection.push(`${pad}${pad}user: '${config.user}',`);
		connection.push(`${pad}${pad}password: '${config.password}',`);
		connection.push(`${pad}${pad}port: ${config.port},`);
		connection.push(`${pad}},`);
		connection.push(`};`);

		return `${imports.join('\n')}\n\n${connection.join('\n')}\n\n${exports.join('\n')}\n`;
	}
}
