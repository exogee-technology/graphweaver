import { logger } from '@exogee/logger';

export const requireEnvironmentVariable = (
	envStr: string,
	warnOnly?: boolean
): string | undefined => {
	const envVar = process.env[envStr];
	if (!envVar) {
		if (warnOnly) {
			logger.warn(`${envStr} is required in environment.`);
			return;
		}
		throw new Error(`${envStr} required but not found.`);
	}
	return envVar;
};

export const config = {};
