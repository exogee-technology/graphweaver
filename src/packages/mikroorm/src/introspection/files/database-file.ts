import { Options } from '@mikro-orm/core';
import { DatabaseType } from '../../database';
import { IntrospectionOptions } from '../generate';
import { driverOptionsForSsl } from '../ssl';

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

// Marks a value that should be written into the generated file as code instead of as data.
class CodeExpression {
	constructor(readonly code: string) {}
}

// Turns a plain object into the source code for the same object, indented to sit at `depth`.
const serialise = (value: unknown, depth: number): string => {
	if (value instanceof CodeExpression) return value.code;

	if (Array.isArray(value)) {
		const entries = value.map((entry) => `${pad.repeat(depth + 1)}${serialise(entry, depth + 1)},`);
		return `[\n${entries.join('\n')}\n${pad.repeat(depth)}]`;
	}

	if (value && typeof value === 'object') {
		const entries = Object.entries(value).map(
			([key, entry]) => `${pad.repeat(depth + 1)}${key}: ${serialise(entry, depth + 1)},`
		);
		return `{\n${entries.join('\n')}\n${pad.repeat(depth)}}`;
	}

	return JSON.stringify(value);
};

export class DatabaseFile {
	constructor(
		protected readonly databaseType: DatabaseType,
		protected readonly connection: IntrospectionOptions
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

		// Certificates the developer gave us as a path stay a path in the generated file, so the
		// project reads them at startup rather than carrying a copy of them around in its source.
		let readsCertificatesFromDisk = false;
		const driverOptions = driverOptionsForSsl(
			this.databaseType,
			this.connection.ssl,
			(certificateOrPath) => {
				if (certificateOrPath.includes('-----BEGIN')) return certificateOrPath;

				readsCertificatesFromDisk = true;
				const quotedPath = `'${certificateOrPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
				return new CodeExpression(`readFileSync(${quotedPath}, 'utf-8')`);
			}
		);

		if (readsCertificatesFromDisk) imports.unshift(`import { readFileSync } from 'node:fs';`);

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
		if (driverOptions) {
			connection.push(`${pad}${pad}driverOptions: ${serialise(driverOptions, 2)},`);
		}
		connection.push(`${pad}},`);
		connection.push(`};`);

		return `${imports.join('\n')}\n\n${connection.join('\n')}\n\n${exports.join('\n')}\n`;
	}
}
