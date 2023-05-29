import { writeFileSync, mkdirSync } from 'fs';
import { Backend, packagesForBackend } from './backend';
import { AWS_LAMBDA_VERSION, GRAPHWEAVER_TARGET_VERSION } from './constants';

export const makePackageJson = (projectName: string, backends: Backend[]) => {
	const backendPackages = Object.assign(
		{},
		...backends.map((backend) => packagesForBackend(backend))
	);

	const packageJson = {
		name: projectName,
		version: '0.1.0',
		description: `${projectName} GraphWeaver Project`,
		scripts: {
			build: 'graphweaver build',
			start: 'graphweaver start',
		},
		dependencies: {
			'@as-integrations/aws-lambda': AWS_LAMBDA_VERSION,
			'@exogee/graphweaver': GRAPHWEAVER_TARGET_VERSION,
			'@exogee/graphweaver-apollo': GRAPHWEAVER_TARGET_VERSION,
			'@exogee/graphweaver-cli': GRAPHWEAVER_TARGET_VERSION,
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
	mkdirSync(`${projectName}/src/backend/schema/ping`);
};

export const makeIndex = (projectName: string, backends: Backend[]) => {
	const myDriverImport = `import { MySqlDriver } from '@mikro-orm/mysql';`;
	const myConfig = `{
			connectionManagerId: 'my',
			mikroOrmConfig: {
				driver: MySqlDriver,
				entities: [],
				dbName: '%%REPLACE_WITH_DB_NAME%%',
				user: '%%REPLACE_WITH_USERNAME%%',
				password: '%%REPLACE_WITH_PASSWORD%%',
				port: 3306,
			},
		},`;

	const pgDriverImport = `import { PostgreSqlDriver } from '@mikro-orm/postgresql';`;
	const pgConfig = `{
			connectionManagerId: 'pg',
			mikroOrmConfig: {
				driver: PostgreSqlDriver,
				entities: [],
				dbName: '%%REPLACE_WITH_DB_NAME%%',
				user: '%%REPLACE_WITH_USERNAME%%',
				password: '%%REPLACE_WITH_PASSWORD%%',
				port: 5432,
			},
		},`;

	const hasPostgres = backends.some((backend) => backend === Backend.MikroOrmPostgres);
	const hasMySql = backends.some((backend) => backend === Backend.MikroOrmMysql);

	const index = `\
/* ${projectName} GraphWeaver Project */

import 'reflect-metadata';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import Graphweaver from '@exogee/graphweaver-apollo';
${hasPostgres ? pgDriverImport : ``}
${hasMySql ? myDriverImport : ``}
import { PingResolver } from './schema/ping';

const isOffline = process.env.IS_OFFLINE === 'true';

const graphweaver = new Graphweaver({
	resolvers: [PingResolver],
	apolloServerOptions: {
		introspection: isOffline,
	},
	adminMetadata: { enabled: true },
	${
		hasPostgres || hasMySql
			? `mikroOrmOptions: [
		${hasPostgres ? pgConfig : ``}
		${hasMySql ? myConfig : ``}
	],`
			: ``
	}
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
import { buildSchemaSync, Resolver, Query } from 'type-graphql';

@Resolver()
export class PingResolver {
	@Query(() => Boolean)
	async ping() {
    		return true; 
  	}
}   
`;

	writeFileSync(`${projectName}/src/backend/schema/ping/index.ts`, index);
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
