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
			'apollo-server': '3.11.1',
			'apollo-server-core': '3.10.3',
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
${
	backends.includes(Backend.MikroORMPostgres)
		? `import { connectToDatabase } from '@exogee/graphweaver-apollo';`
		: ``
}
import { ApolloServer } from 'apollo-server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import open from 'open';
import { config } from 'dotenv';

config();

import { schema${
		backends.includes(Backend.MikroORMPostgres) ? `, mikroOrmEntities` : ''
	} } from './schema';

const server = new ApolloServer({
        schema,
        plugins: [${
					backends.includes(Backend.MikroORMPostgres)
						? `connectToDatabase({ mikroOrmConfig: { entities: mikroOrmEntities } }),\n`
						: ''
				}
                ApolloServerPluginLandingPageGraphQLPlayground,
        ],
        introspection: true,
});

(async () => {
        const info = await server.listen();
        console.log(\`GraphWeaver is ready and awaiting at \${info.url}\`);
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
class PingResolver {
	@Query(() => Boolean)
	async ping() {
    		return true; 
  	}
}

export const schema = buildSchemaSync({
        resolvers: [ 
		PingResolver, 
		/* Insert Resolvers Here */
	],
});      

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
		include: ['./src'],
	};

	writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 4));
};

export const makeReadme = (projectName: string) => {
	const readme = `# ${projectName} GraphWeaver Project`;
	writeFileSync('README.md', readme);
};
