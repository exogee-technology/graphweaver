import { ApolloServer } from '@apollo/server';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { GraphweaverPlugin } from '@exogee/graphweaver';
import { onRequestWrapper } from './utils';
import { logger } from '@exogee/logger';

export const startServerless = ({
	server,
	graphweaverPlugins,
}: {
	graphweaverPlugins: Set<GraphweaverPlugin<AWSLambda.APIGatewayProxyResult>>;
	server: ApolloServer<any>;
}): AWSLambda.APIGatewayProxyHandler => {
	const handler = startServerAndCreateLambdaHandler(
		server,
		handlers.createAPIGatewayProxyEventRequestHandler()
	);

	return (event, context) =>
		onRequestWrapper(graphweaverPlugins, async () => {
			try {
				const res = await handler(event, context, () => {});
				if (!res) {
					throw new Error('Handler Response was undefined or null.');
				}
				return res;
			} finally {
				// Ensure we always flush logs on each request.
				logger.flush();
			}
		});
};
