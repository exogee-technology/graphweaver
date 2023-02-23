import * as dotenv from 'dotenv';
dotenv.config();

import { logger } from '@exogee/logger';

import { runMigrations } from '../run-migrations';

runMigrations()
	.catch((error) => {
		logger.error(error);
		// We have an error and have finished processing so we should exit with a status of failed
		process.exit(1);
	})
	.then(() => {
		logger.trace('Success');
	});
