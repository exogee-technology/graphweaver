import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

export interface CorsPluginOptions {
	validateOrigin?(origin: string): boolean;
}

export const corsPlugin = ({
	validateOrigin = () => false,
}: CorsPluginOptions = {}): ApolloServerPlugin => ({
	async requestDidStart({ request }) {
		return {
			willSendResponse: async ({ response }) => {
				response.http?.headers.set(
					'Access-Control-Allow-Headers',
					[
						'Content-Type',
						'X-Amz-Date',
						'Authorization',
						'X-Api-Key',
						'X-Amz-Security-Token',
						'X-Amz-User-Agent',
						'Xsrf-Token',
						'X-Auth-Redirect',
						'Apollo-Require-Preflight',
					].join(',')
				);

				response.http?.headers.set(
					'Access-Control-Expose-Headers',
					[
						// We need our auth headers to be accessible by the JS so we can store them.
						// You also MUST use CSP headers to ensure that if XSS is accidentally
						// possible, scripts injected on the page aren't allowed to run.
						'Authorization',

						// This is how the server tells the client that it needs to redirect to
						// an OAuth provider to get a token or code.
						'X-Auth-Redirect',
					].join(',')
				);

				const defaultOrigin = 'http://localhost:9000';
				const origin = request.http?.headers.get('origin') || defaultOrigin;
				response.http?.headers.set('Access-Control-Allow-Credentials', 'true');

				if (validateOrigin(origin)) {
					// Ok, this is a graphweaver request
					logger.trace(`Adding CORS allow origin header: ${origin}`);
					response.http?.headers.set('Access-Control-Allow-Origin', origin);
				} else if (origin === defaultOrigin) {
					// Ok, dev machine
					logger.trace(`Adding CORS allow origin header: ${origin}`);
					response.http?.headers.set('Access-Control-Allow-Origin', origin);
				} else {
					// Ok, we don't know who you are, you can't access this.
					logger.trace(`No CORS match, adding allow header false`);
					response.http?.headers.set('Access-Control-Allow-Headers', 'false');
				}
			},
		};
	},
});
