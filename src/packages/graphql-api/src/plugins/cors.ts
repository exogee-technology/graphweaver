import { logger } from '@exogee/logger';
import { PluginDefinition } from 'apollo-server-core';

export const Cors: PluginDefinition = {
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
					].join(',')
				);

				const rootDomain = process.env.ROOT_DOMAIN;
				const deploymentEnv = process.env.DEPLOYMENT_ENVIRONMENT || 'development';
				const subdomain = deploymentEnv === 'production' ? 'easy' : `easy-${deploymentEnv}`;
				const domainName = `${subdomain}.${rootDomain}`;

				const defaultOrigin = 'http://localhost:3000';
				const origin = request.http?.headers.get('origin') || defaultOrigin;
				response.http?.headers.set('Access-Control-Allow-Credentials', 'true');
				if (origin?.endsWith(domainName)) {
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
};
