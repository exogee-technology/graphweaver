import { defineConnection, type ConnectableDialect } from '@exogee/graphweaver-sql';
import { introspectorFor } from '@exogee/graphweaver-sql/lib/introspection';
import { generateFiles, CodeExpression } from '@exogee/graphweaver-sql/lib/codegen';
import type { GeneratedFile } from '@exogee/graphweaver-sql/lib/codegen';

import type { DatabaseOptions, Source } from '../auth';
import { sslOptionsForDialect } from './ssl';

export interface APIOptions {
	clientGeneratedPrimaryKeys?: boolean;
}

export type Dialect = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

/** The CLI speaks in driver names; the provider speaks in dialects. */
export const dialectForSource = (source: Source): Dialect =>
	source === 'postgresql' ? 'postgres' : source;

/**
 * Opens a connection for introspection.
 *
 * The dialect packages are imported dynamically so that importing from, say, MySQL does not require
 * the Postgres driver to be installed.
 */
const dialectFor = async (
	dialect: Dialect,
	options: DatabaseOptions
): Promise<ConnectableDialect> => {
	const ssl = sslOptionsForDialect(dialect, options.ssl);

	if (dialect === 'sqlite') {
		const { sqlite } = await import('@exogee/graphweaver-sql-sqlite');
		return sqlite({ filename: options.dbName, fileMustExist: true });
	}

	if (dialect === 'postgres') {
		const { postgres } = await import('@exogee/graphweaver-sql-postgres');
		return postgres({
			host: options.host,
			port: options.port,
			user: options.user,
			password: options.password,
			database: options.dbName,
			...ssl,
		});
	}

	if (dialect === 'mysql') {
		const { mysql } = await import('@exogee/graphweaver-sql-mysql');
		return mysql({
			host: options.host,
			port: options.port,
			user: options.user,
			password: options.password,
			database: options.dbName,
			...ssl,
		});
	}

	const { mssql } = await import('@exogee/graphweaver-sql-mssql');
	return mssql({
		host: options.host,
		port: options.port,
		user: options.user,
		password: options.password,
		database: options.dbName,
		...mssqlTls(ssl),
	});
};

/**
 * TLS settings for SQL Server.
 *
 * tedious encrypts by default, so a user who passed no SSL flags would be asking for TLS without
 * knowing it. Turning it off explicitly is what makes the generated `database.ts` connect to the
 * same server the import just read, instead of failing a handshake the import never attempted --
 * which is only true because both paths go through here.
 */
const mssqlTls = (ssl: Record<string, unknown> | undefined) =>
	ssl ?? { encrypt: false, trustServerCertificate: true };

/**
 * Builds the connection literal that goes into the generated `database.ts`.
 *
 * A certificate given as a path is emitted as a `readFileSync` call rather than inlined, so the
 * generated file does not end up with a private key committed inside it.
 */
const connectionLiteralFor = (dialect: Dialect, options: DatabaseOptions) => {
	let needsReadFileSync = false;

	const ssl = sslOptionsForDialect(dialect, options.ssl, (certificateOrPath) => {
		if (certificateOrPath.includes('-----BEGIN')) return certificateOrPath;

		needsReadFileSync = true;
		const quoted = `'${certificateOrPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
		return new CodeExpression(`readFileSync(${quoted}, 'utf-8')`);
	});

	const connection =
		dialect === 'sqlite'
			? { filename: new CodeExpression(`process.env.DATABASE_NAME ?? '${options.dbName}'`) }
			: {
					host: new CodeExpression(`process.env.DATABASE_HOST ?? '${options.host ?? 'localhost'}'`),
					port: new CodeExpression(
						`process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : ${options.port}`
					),
					user: new CodeExpression(`process.env.DATABASE_USER ?? '${options.user ?? ''}'`),
					password: new CodeExpression('process.env.DATABASE_PASSWORD'),
					database: new CodeExpression(`process.env.DATABASE_NAME ?? '${options.dbName ?? ''}'`),
					...(dialect === 'mssql' ? mssqlTls(ssl) : ssl),
				};

	return { connection, needsReadFileSync };
};

export const startIntrospection = async (
	databaseOptions: DatabaseOptions,
	apiOptions?: APIOptions
): Promise<GeneratedFile[]> => {
	if (!databaseOptions.source) {
		throw new Error('No source specified, please specify a data source.');
	}

	const dialect = dialectForSource(databaseOptions.source);
	const connection = defineConnection({
		id: 'introspection',
		dialect: await dialectFor(dialect, databaseOptions),
	});

	try {
		await connection.connect();

		const schema = await introspectorFor(dialect).introspect(async (sql, params) => {
			const { rows } = await connection.query({
				text: sql,
				params: (params ?? []).map((value) => ({ value, type: 'unknown' as const })),
			});
			return rows as Record<string, unknown>[];
		});

		const literal = connectionLiteralFor(dialect, databaseOptions);

		const { files, errors, warnings } = generateFiles({
			schema,
			dialect,
			connectionId: databaseOptions.source,
			connection: literal.connection,
			needsReadFileSync: literal.needsReadFileSync,
		});

		for (const warning of warnings) console.warn(warning);
		for (const error of errors) console.warn(error);

		void apiOptions;
		return files;
	} finally {
		// Close the pool so the CLI can exit on its own, rather than needing process.exit().
		await connection.close();
	}
};
