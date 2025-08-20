import { writeFile } from 'fs/promises';

import { generateConfig } from './config.js';
import { generateAuthEnv } from './env.js';
import { generateAdminPassword } from './password.js';
import { generateApiKey } from './api-key.js';

export type Source = 'mysql' | 'postgresql' | 'sqlite' | 'mssql';

export interface DatabaseOptions {
	source?: Source;
	dbName?: string;
	host?: string;
	port?: number;
	password?: string;
	user?: string;
}

export type AuthMethod = 'password' | 'api-key' | 'magic-link';

interface InitialiseAuthOptions extends DatabaseOptions {
	method: AuthMethod;
	tableName: string;
}

export const initialiseAuth = async ({ method, ...databaseOptions }: InitialiseAuthOptions) => {
	console.log(`Initialising Auth with ${method}...`);
	const envFile = await generateAuthEnv(method);
	await writeFile('.env', envFile);
	console.log('Environment file generated (./.env)');

	if (method === 'password' || method === 'magic-link') {
		const configFile = await generateConfig(method);
		await writeFile('graphweaver-config.js', configFile);
		console.log('Config file generated (./graphweaver-config.js)\n');
	}

	if (method === 'password') {
		await generateAdminPassword(databaseOptions);
	}

	if (method === 'api-key') {
		await generateApiKey(databaseOptions);
	}

	console.log(`\n${method} auth initialised successfully\n`);
};
