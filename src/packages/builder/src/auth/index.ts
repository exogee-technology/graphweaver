import { writeFile } from 'fs/promises';

import { generateConfig } from './config';
import { generateAuthEnv } from './env';
import { generateAdminPassword } from './password';
import { generateApiKey } from './api-key';

export type Source = 'mysql' | 'postgresql' | 'sqlite';

export interface DatabaseOptions {
	source: Source;
	database: string;
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

	if (method === 'password' || method === 'magic-link') {
		const configFile = await generateConfig(method);
		await writeFile('graphweaver-config.js', configFile);
	}

	if (method === 'password') {
		await generateAdminPassword(databaseOptions);
	}

	if (method === 'api-key') {
		await generateApiKey(databaseOptions);
	}
};
