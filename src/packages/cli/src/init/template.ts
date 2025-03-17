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
	const hasPostgres = backends.some((backend) => backend === Backend.Postgres);
	const hasMySql = backends.some((backend) => backend === Backend.Mysql);
	const hasSqlite = backends.some((backend) => backend === Backend.Sqlite);

	let example;
	if (hasPostgres) {
		example = `import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export const connection = {
	connectionManagerId: 'postgres',
	mikroOrmConfig: {
		driver: PostgreSqlDriver,
		entities: [],
		dbName: process.env.DATABASE_NAME || 'your_db_name',
		user: process.env.DATABASE_USER || 'your_user',
		password: process.env.DATABASE_PASSWORD || 'your_password',
		host: process.env.DATABASE_HOST || 'localhost',
		port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
	},
};`;
	} else if (hasMySql) {
		example = `import { MySqlDriver } from '@mikro-orm/mysql';

export const connection = {
	connectionManagerId: 'mysql',
	mikroOrmConfig: {
		driver: MySqlDriver,
		entities: [],
		dbName: process.env.DATABASE_NAME || 'your_db_name',
		user: process.env.DATABASE_USER || 'your_user',
		password: process.env.DATABASE_PASSWORD || 'your_password',
		port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
	},
};`;
	} else if (hasSqlite) {
		example = `import { SqliteDriver } from 'mikro-orm-sqlite-wasm';

export const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		driver: SqliteDriver,
		entities: [],
		dbName: process.env.DATABASE_NAME || 'your_db_name_with_path',
	},
};`;
	} else {
		throw new Error(`Could not determine database type from ${backends}`);
	}

	const database = `/*
You'll want to import your database connection here or use the 'npx graphweaver@latest import' command do generate it.
Example:

${example}

*/`;

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

export const makeGitIgnore = (projectName: string) => {
	const rootGitIgnore = `
# PNPM store
.pnpm-store

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and *not* Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
.DS_Store

# Built artefacts
lib
bin
node_modules
*.log

# Session-specific authentication
token.json

*.pem

# packs - used to store prebuilt packages
.packs

# npx cognito-local
.cognito

# Federation Tests
supergraph.config.js

# Turbo Repo Caches
**/.turbo

`;
	writeFileSync(`${projectName}/.gitignore`, rootGitIgnore);

	const srcGitIgnore = `
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and *not* Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Typescript Output
**/packages/**/lib

# VSCode settings
.vscode/
.DS_Store

# IntelliJ IDEA settings

# Deployment files

# Performance test results

# Output folders
lib/
.graphweaver/
	`;
	writeFileSync(`${projectName}/src/.gitignore`, srcGitIgnore);
};
