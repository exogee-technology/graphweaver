import type { InvocationContext, HttpRequest } from '@azure/functions';
import { startServerAndCreateHandler } from '@as-integrations/azure-functions';
import { GraphweaverPlugin } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import type { ApolloServer } from '@apollo/server';

import { onRequestWrapper } from './utils';

/**
 * Return type of the Azure v4 HTTP handler (HttpResponse or HttpResponseInit).
 * We use a generic type so the same plugin chain works with only the outer response type differing.
 */
export type AzureHttpHandler = (
	request: HttpRequest,
	context: InvocationContext
) => Promise<unknown>;

export const startServerlessAzure = ({
	server,
	graphweaverPlugins,
}: {
	graphweaverPlugins: Set<GraphweaverPlugin<unknown>>;
	server: ApolloServer<any>;
}): AzureHttpHandler => {
	const handler = startServerAndCreateHandler(server);

	return (request: HttpRequest, context: InvocationContext) =>
		onRequestWrapper<unknown>(graphweaverPlugins, async () => {
			try {
				const res = await handler(request, context);
				if (res === undefined || res === null) {
					throw new Error('Azure handler response was undefined or null.');
				}
				return res;
			} finally {
				logger.flush();
			}
		});
};
