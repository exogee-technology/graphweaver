import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { AuthorizationContext } from '../../../types';
import { Token } from '../../schema';
import { LocalAuthTokenProvider } from './provider';

// const { XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_CLIENT_REDIRECT_URIS } = process.env;
// if (!XERO_CLIENT_ID) throw new Error('XERO_CLIENT_ID is required in environment');
// if (!XERO_CLIENT_SECRET) throw new Error('XERO_CLIENT_SECRET is required in environment');
// if (!XERO_CLIENT_REDIRECT_URIS)
// 	throw new Error('XERO_CLIENT_REDIRECT_URIS is required in environment');

const redirectUrl = 'http://localhost:8000/login'; // @todo make configurable

export const LocalAuthApolloPlugin: ApolloServerPlugin<AuthorizationContext> = {
	async requestDidStart({ request, contextValue }) {
		logger.trace('LocalAuthApolloPlugin requestDidStart');
		// We have two use cases this needs to handle:
		// 1. No auth header, initial request.
		//    - In this situation we need to redirect them to the login page.
		// 2. There is an auth header
		//    - In this situation we need to verify the token, error if it's not valid then send the token back to them.
		//
		// In all situations we need to set the token in the context so the rest of the application can decide whether
		// to send data back to the client or not.

		// We may need to return a redirect to the client. If so, we'll set this variable.
		const authHeader = request.http?.headers.get('authorization');
		let redirect: string;
		let token: Token | undefined = undefined;

		// Case 1: No header, initial request.
		if (!authHeader) {
			logger.trace('No Auth header, setting redirect');
			redirect = redirectUrl;
		} else {
			logger.trace('Got a token, checking for basic failures.');

			const tokenProvider = new LocalAuthTokenProvider();
			const valid = await tokenProvider.verifyToken(authHeader);

			if (!valid) {
				redirect = redirectUrl;
			} else {
				// Ok, now we need to validate the token.
				token = new Token(JSON.parse(authHeader));
				logger.trace('Token parsed successfully.');
			}
		}

		return {
			willSendResponse: async ({ response }) => {
				// If we need to redirect, set the header to tell the client to do so.
				if (redirect) {
					logger.trace('Redirect set, setting X-Auth-Redirect header.');
					response.http?.headers.set('X-Auth-Redirect', redirect);
				}

				// And if we have a new token for the browser to save, we should pass that down too.
				if (token) {
					logger.trace('Token set, setting Authorization header.');
					response.http?.headers.set('Authorization', JSON.stringify(token));
				}
			},
		};
	},
};
