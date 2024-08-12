import { writeFileSync } from 'fs';

import { generateConfig } from './config';
import { generateAuthEnv } from './env';
import { generateAdminPassword } from './password';

export const initialiseAuth = async ({ method }: { method: 'password' }) => {
	console.log(`Initialising Auth with ${method}...`);

	const envFile = await generateAuthEnv();
	writeFileSync('.env', envFile);
	const configFile = await generateConfig();
	writeFileSync('graphweaver-config.js', configFile);
	await generateAdminPassword();
};
