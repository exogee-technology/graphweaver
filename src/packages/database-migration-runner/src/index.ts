import { logger } from '@exogee/logger';
import { Context } from 'aws-lambda';

import { runMigrations } from './run-migrations';

module.exports = {
	handler: async (event: any, context: Context, callback: any) => {
		logger.trace('handler - start');

		try {
			await runMigrations();

			callback(null, {
				statusCode: 200,
				body: 'Success',
			});
		} catch (error) {
			callback(error);
		}
	},
};
