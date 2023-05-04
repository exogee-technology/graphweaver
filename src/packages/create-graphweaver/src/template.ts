import { writeFileSync, mkdirSync } from 'fs';
import { Backend, packagesForBackend } from './backend';
import { GRAPHWEAVER_TARGET_VERSION } from './constants';

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
			start: 'ts-node src/index.ts',
		},
		dependencies: {
			'@exogee/graphweaver': GRAPHWEAVER_TARGET_VERSION,
			'@exogee/graphweaver-cli': GRAPHWEAVER_TARGET_VERSION,
			...backendPackages,
			'reflect-metadata': '0.1.13',
			'type-graphql': '2.0.0-beta.1',
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
	mkdirSync(`${projectName}/src/schema`);
};

export const makeIndex = (projectName: string, backends: Backend[]) => {
	const index = `\
/* ${projectName} GraphWeaver Project */

import 'reflect-metadata';
import Graphweaver, { startStandaloneServer } from '@exogee/graphweaver-apollo';
import { PingResolver } from './schema';

config();

const graphweaver = new Graphweaver({
	resolvers: [PingResolver as any],
	mikroOrmOptions: { mikroOrmConfig: { entities: [] } },
	apolloServerOptions: {
		introspection: process.env.IS_OFFLINE === 'true',
		schema: {} as any, // @todo
		plugins: [],
	},
	adminMetadata: { enabled: true },
});

(async () => {
	const { url } = await startStandaloneServer(graphweaver.server);
	console.log(\`GraphWeaver with apollo is ready and awaiting at \${url}\`);
	open(url);
})();
`;

	writeFileSync(`${projectName}/src/index.ts`, index);
};

export const makeSchemaIndex = (projectName: string, backends: Backend[]) => {
	const index = `\
/* ${projectName} GraphWeaver Project - Schema */
import { buildSchemaSync, Resolver, Query } from 'type-graphql';

${
	backends.includes(Backend.MikroOrmPostgres) || backends.includes(Backend.MikroOrmMysql)
		? `export const mikroOrmEntities = [ /* Insert MikroORM Entities Here */ ];`
		: ``
}

@Resolver()
export class PingResolver {
	@Query(() => Boolean)
	async ping() {
    		return true; 
  	}
}   
`;

	writeFileSync(`${projectName}/src/schema/index.ts`, index);
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
