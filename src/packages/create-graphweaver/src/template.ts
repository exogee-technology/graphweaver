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
			...backendPackages,
			graphql: '15.8.0',
			'reflect-metadata': '0.1.13',
			'type-graphql': '1.1.1',
		},
		devDependencies: {
			'@types/node': '14.14.10',
			open: '8.4.0',
			'ts-node': '10.9.1',
			typescript: '4.5.4',
			dotenv: '16.0.0',
		},
	};

	writeFileSync('package.json', JSON.stringify(packageJson, null, 4));
};

export const makeDirectories = () => {
	mkdirSync('src');
	mkdirSync('src/schema');
};

export const makeIndex = (projectName: string, backends: Backend[]) => {
	const index = `\
/* ${projectName} GraphWeaver Project */

import 'reflect-metadata';
import Graphweaver,{ connectToDatabase } from '@exogee/graphweaver-apollo';
import open from 'open';
import { config } from 'dotenv';
import { PingResolver } from './schema';

config();

const graphweaver = new Graphweaver({
	resolvers: [ PingResolver as any ],
	mikroOrmOptions: { mikroOrmConfig: { entities: [] } },
	plugins: [],
	adminMetadata: { enabled: true },
	introspection: process.env.IS_OFFLINE === 'true',
});

(async () => {
        const info = await graphweaver.server.listen();
        console.log(\`GraphWeaver with apollo is ready and awaiting at \${info.url}\`);
        open(info.url);
})();
`;

	writeFileSync('src/index.ts', index);
};

export const makeSchemaIndex = (projectName: string, backends: Backend[]) => {
	const index = `\
/* ${projectName} GraphWeaver Project - Schema */
import { buildSchemaSync, Resolver, Query } from 'type-graphql';

${
	backends.includes(Backend.MikroORMPostgres)
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

	writeFileSync('src/schema/index.ts', index);
};

export const makeTsConfig = () => {
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

	writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 4));
};

export const makeReadme = (projectName: string) => {
	const readme = `# ${projectName} GraphWeaver Project`;
	writeFileSync('README.md', readme);
};
