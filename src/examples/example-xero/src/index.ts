import 'reflect-metadata';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
const isOffline = process.env.IS_OFFLINE === 'true';
const envPath = isOffline ? path.join(__dirname, '../.env') : undefined;
dotenv.config({
	path: envPath,
});

import Graphweaver, {
	ApolloServerPluginLandingPageGraphQLPlayground,
} from '@exogee/graphweaver-apollo';
import { logger } from '@exogee/logger';

import { AccountResolver, ProfitAndLossRowResolver } from './schema';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { TokenSet } from 'xero-node';

XeroBackendProvider.accessTokenProvider = {
	get: async () => JSON.parse(await fs.readFile('./token.json', 'utf-8')),
	set: async (newToken: TokenSet) =>
		await fs.writeFile('./token.json', JSON.stringify(newToken, null, 4), 'utf-8'),
};

const pluginsWithPlayground = isOffline
	? [
			ApolloServerPluginLandingPageGraphQLPlayground({
				endpoint: '/graphql/v1',
				settings: {
					'request.credentials': 'include',
				},
			}),
	  ]
	: [];

logger.info(`example-xero start Graphweaver`);
const graphweaver = new Graphweaver({
	resolvers: [AccountResolver, ProfitAndLossRowResolver],
	plugins: pluginsWithPlayground,
	adminMetadata: { enabled: true },
	introspection: process.env.IS_OFFLINE === 'true',

	// TODO: Remove
	mikroOrmOptions: {},
});
logger.info(`example-xero graphweaver.server start`);

exports.handler = graphweaver.server.createHandler({
	expressGetMiddlewareOptions: { bodyParserConfig: { limit: '5mb' } },
});
