import { writeFileSync, mkdirSync } from 'fs';
import { packagesForBackend } from './backend';
import {
	graphweaverVersion,
	AS_INTEGRATIONS_AWS_LAMBDA_TARGET_VERSION,
	GRAPHQL_TARGET_VERSION,
	NODE_TYPES_TARGET_VERSION,
	TYPESCRIPT_TARGET_VERSION,
} from './constants';
import { Backend } from '.';

export const makePackageJson = (projectName: string, backends: Backend[], version?: string) => {
	const backendPackages = Object.assign(
		{},
		...backends.map((backend) => packagesForBackend(backend, version))
	);

	const packageJson = {
		name: projectName,
		version: '0.1.0',
		description: `${projectName} Graphweaver Project`,
		scripts: {
			build: 'graphweaver build',
			start: 'graphweaver start',
			watch: 'graphweaver watch',
			import: 'graphweaver import',
		},
		dependencies: {
			'@as-integrations/aws-lambda': AS_INTEGRATIONS_AWS_LAMBDA_TARGET_VERSION,
			'@exogee/graphweaver': graphweaverVersion(version, '@exogee/graphweaver'),
			'@exogee/graphweaver-scalars': graphweaverVersion(version, '@exogee/graphweaver-scalars'),
			'@exogee/graphweaver-server': graphweaverVersion(version, '@exogee/graphweaver-server'),
			...backendPackages,
			graphql: GRAPHQL_TARGET_VERSION,
		},
		devDependencies: {
			'@types/node': NODE_TYPES_TARGET_VERSION,
			graphweaver: graphweaverVersion(version, 'graphweaver'),
			typescript: TYPESCRIPT_TARGET_VERSION,
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

	const liteDriverImport = `import { SqliteDriver } from 'mikro-orm-sqlite-wasm';`;
	const liteConnection = `export const liteConnection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		driver: SqliteDriver,
		entities: [],
		dbName: '%%REPLACE_WITH_DB_NAME%%',
	},
};`;

	const hasPostgres = backends.some((backend) => backend === Backend.Postgres);
	const hasMySql = backends.some((backend) => backend === Backend.Mysql);
	const hasSqlite = backends.some((backend) => backend === Backend.Sqlite);

	const database = `
${hasPostgres ? pgDriverImport : ``}
${hasMySql ? myDriverImport : ``}
${hasSqlite ? liteDriverImport : ``}

${hasPostgres ? pgConnection : ``}
${hasMySql ? myConnection : ``}
${hasSqlite ? liteConnection : ``}

	`;

	writeFileSync(`${projectName}/src/backend/database.ts`, database);
};

export const makeIndex = (projectName: string) => {
	const index = `\
/* ${projectName} Graphweaver Project */
import Graphweaver from '@exogee/graphweaver-server';

import './schema';

export const graphweaver = new Graphweaver();
export const handler = graphweaver.handler();

`;

	writeFileSync(`${projectName}/src/backend/index.ts`, index);
};

export const makeSchemaIndex = (projectName: string) => {
	const index = `\
/* ${projectName} Graphweaver Project - Schema */
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
			skipLibCheck: true,
		},
		exclude: ['**/node_modules/**', '**/lib/**'],
		include: ['./src'],
	};

	writeFileSync(`${projectName}/tsconfig.json`, JSON.stringify(tsConfig, null, 4));
};

export const makeReadme = (projectName: string) => {
	const readme = `# ${projectName} Graphweaver Project`;
	writeFileSync(`${projectName}/README.md`, readme);
};
