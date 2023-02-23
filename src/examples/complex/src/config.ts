import * as dotenv from 'dotenv';
import * as path from 'path';

export const envPath = process.env.IS_OFFLINE ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});
export const requireEnvironmentVariable = (envStr: string): string => {
	const envVar = process.env[envStr];
	if (!envVar) throw new Error(`${envStr} required but not found`);
	return envVar;
};
