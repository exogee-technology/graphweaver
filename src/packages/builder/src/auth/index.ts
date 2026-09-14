import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';

import { generateConfig } from './config';
import { generateAuthEnv } from './env';
import { generateAdminPassword } from './password';
import { generateApiKey } from './api-key';

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
		// A TypeScript config takes precedence over a JavaScript one, so if the project already has
		// one, write there. Generating a graphweaver-config.js next to it would be ignored.
		const configFileName =
			['graphweaver-config.ts', 'graphweaver-config.mts', 'graphweaver-config.cts'].find((path) =>
				existsSync(path)
			) ?? 'graphweaver-config.js';

		const configFile = await generateConfig(method, configFileName);
		await writeFile(configFileName, configFile);
		console.log(`Config file generated (./${configFileName})\n`);
	}

	if (method === 'password') {
		await generateAdminPassword(databaseOptions);
	}

	if (method === 'api-key') {
		await generateApiKey(databaseOptions);
	}

	console.log(`\n${method} auth initialised successfully\n`);
};
