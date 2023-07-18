import { writeFileSync, mkdirSync } from 'fs';
import { packagesForBackend } from './backend';
import { AWS_LAMBDA_VERSION, GRAPHWEAVER_TARGET_VERSION } from './constants';
import { Backend, needsDatabaseConnection } from '.';

export const makePackageJson = (projectName: string, backends: Backend[], version?: string) => {
	const backendPackages = Object.assign(
		{},
		...backends.map((backend) => packagesForBackend(backend, version))
	);

	const graphWeaverVersion = version ?? GRAPHWEAVER_TARGET_VERSION;

	const packageJson = {
		name: projectName,
		version: '0.1.0',
		description: `${projectName} GraphWeaver Project`,
		scripts: {
			build: 'graphweaver build',
			start: 'graphweaver start',
			watch: 'graphweaver watch',
		},
		dependencies: {
			'@as-integrations/aws-lambda': AWS_LAMBDA_VERSION,
			'@exogee/graphweaver': graphWeaverVersion,
			'@exogee/graphweaver-scalars': graphWeaverVersion,
			'@exogee/graphweaver-apollo': graphWeaverVersion,
			graphweaver: graphWeaverVersion,
			...backendPackages,
			'reflect-metadata': '0.1.13',
			'type-graphql': '2.0.0-beta.2',
			'class-validator': '0.14.0',
			graphql: '16.6.0',
		},
		devDependencies: {
			'@types/node': '14.14.10',
			typescript: '5.0.2',
		},
	};

	writeFileSync(`${projectName}/package.json`, JSON.stringify(packageJson, null, 4));
};

export const makeDirectories = (projectName: string) => {
	mkdirSync(projectName);
	mkdirSync(`${projectName}/src`);
	mkdirSync(`${projectName}/src/backend`);
	mkdirSync(`${projectName}/src/backend/schema`);
};

export const makeDatabase = (projectName: string, backends: Backend[]) => {
	const myDriverImport = `import { MySqlDriver } from '@mikro-orm/mysql';`;
	const myConnection = `export const myConnection = {
	connectionManagerId: 'my',
	mikroOrmConfig: {
		driver: MySqlDriver,
		entities: [],
		dbName: '%%REPLACE_WITH_DB_NAME%%',
		user: '%%REPLACE_WITH_USERNAME%%',
		password: '%%REPLACE_WITH_PASSWORD%%',
		port: 3306,
	},
};`;

	const pgDriverImport = `import { PostgreSqlDriver } from '@mikro-orm/postgresql';`;
	const pgConnection = `export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		driver: PostgreSqlDriver,
		entities: [],
		dbName: '%%REPLACE_WITH_DB_NAME%%',
		user: '%%REPLACE_WITH_USERNAME%%',
		password: '%%REPLACE_WITH_PASSWORD%%',
		port: 5432,
	},
};`;

	const liteDriverImport = `import { SqliteDriver } from '@mikro-orm/sqlite';`;
	const liteConnection = `export const liteConnection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		driver: SqliteDriver,
		entities: [],
		dbName: '%%REPLACE_WITH_DB_NAME%%',
	},
};`;

	const hasPostgres = backends.some((backend) => backend === Backend.MikroOrmPostgres);
	const hasMySql = backends.some((backend) => backend === Backend.MikroOrmMysql);
	const hasSqlite = backends.some((backend) => backend === Backend.MikroOrmSqlite);

	// Install the Apollo plugins on the server
	let plugins = undefined;
	if (hasPostgres && hasMySql) {
		plugins = `[connectToDatabase([pgConnection, myConnection]), ClearDatabaseContext]`;
	} else if (hasPostgres) {
		plugins = `[connectToDatabase(pgConnection), ClearDatabaseContext]`;
	} else if (hasMySql) {
		plugins = `[connectToDatabase(myConnection), ClearDatabaseContext]`;
	} else if (hasSqlite) {
		plugins = `[connectToDatabase(liteConnection), ClearDatabaseContext]`;
	}

	const database = `import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';
${hasPostgres ? pgDriverImport : ``}
${hasMySql ? myDriverImport : ``}
${hasSqlite ? liteDriverImport : ``}

${hasPostgres ? pgConnection : ``}
${hasMySql ? myConnection : ``}
${hasSqlite ? liteConnection : ``}

export const plugins = ${plugins};
	`;

	writeFileSync(`${projectName}/src/backend/database.ts`, database);
};

export const makeIndex = (projectName: string, backends: Backend[]) => {
	const hasDatabaseConnections = needsDatabaseConnection(backends);

	const index = `\
/* ${projectName} GraphWeaver Project */

import 'reflect-metadata';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import Graphweaver from '@exogee/graphweaver-apollo';
${hasDatabaseConnections ? `import { plugins } from './database';` : ''}
import { resolvers } from './schema';

const isOffline = process.env.IS_OFFLINE === 'true';

const graphweaver = new Graphweaver({
	resolvers,
	apolloServerOptions: {
		introspection: isOffline,
		${hasDatabaseConnections ? `plugins,` : ''}
	},
	adminMetadata: { enabled: true },
});

export const handler = startServerAndCreateLambdaHandler<any>(
	graphweaver.server,
	handlers.createAPIGatewayProxyEventRequestHandler()
);


`;

	writeFileSync(`${projectName}/src/backend/index.ts`, index);
};

export const makeSchemaIndex = (projectName: string, backends: Backend[]) => {
	const index = `\
/* ${projectName} GraphWeaver Project - Schema */
export const resolvers = []; // add your resolvers here 
`;

	writeFileSync(`${projectName}/src/backend/schema/index.ts`, index);
};

export const makeTsConfig = (projectName: string) => {
	const tsConfig = {
		compilerOptions: {
			outDir: './lib',
			rootDir: './src',
			noUnusedLocals: false,
			experimentalDecorators: true,
			emitDecoratorMetadata: true,
			target: 'es2019',
			module: 'CommonJS',
			allowSyntheticDefaultImports: true,
			esModuleInterop: true,
		},
		exclude: ['**/node_modules/**', '**/lib/**'],
		include: ['./src'],
	};

	writeFileSync(`${projectName}/tsconfig.json`, JSON.stringify(tsConfig, null, 4));
};

export const makeReadme = (projectName: string) => {
	const readme = `# ${projectName} GraphWeaver Project`;
	writeFileSync(`${projectName}/README.md`, readme);
};
