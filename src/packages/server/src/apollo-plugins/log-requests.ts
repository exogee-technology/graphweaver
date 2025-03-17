import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { getDidResolveOperationItemsToLog, extractInitialQuerySegment } from './utils';

// This plugin logs on each request.
export const LogRequests: ApolloServerPlugin = {
	async requestDidStart({ request: { variables, query } }) {
		logger.info(extractInitialQuerySegment(query), 'Query Received');

		let requestOperationName: string | null;
		return {
			async didResolveOperation({ operationName, operation }) {
				requestOperationName = operationName;
				if (!operation) return;

				const logItems = getDidResolveOperationItemsToLog(operation, variables);

				logItems.forEach(({ query, variables }) => {
					logger.info(
						{
							query,
							variables,
						},
						'Operation Resolved'
					);
				});
			},

			async willSendResponse({ response }) {
				logger.info(
					{ operation: requestOperationName },
					`Sending ${JSON.stringify(response).length * 2} bytes in response.`
				);
			},
		};
	},
};
