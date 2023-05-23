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
const guestOperations = ['login'];

export const LocalAuthApolloPlugin: ApolloServerPlugin<AuthorizationContext> = {
	async requestDidStart({ request, contextValue }) {
		logger.trace('LocalAuthApolloPlugin requestDidStart');
		// We have two use cases this needs to handle:
		// 1. No auth header, initial request for a guest operation.
		//    - Some requests are allowed when accessed by a guest defined above.
		// 2. No auth header, initial request.
		//    - In this situation we need to redirect them to the login page.
		// 3. There is an auth header
		//    - In this situation we need to verify the token, error if it's not valid and redirect.
		//

		// We may need to return a redirect to the client. If so, we'll set this variable.
		const authHeader = request.http?.headers.get('authorization');
		const operation = request.operationName;
		let redirect: string;

		// Case 1. No auth header, initial request for a guest operation.
		if (guestOperations.some((guestOperation) => guestOperation === operation)) {
			// If we are here then we do nothing as the operation requested was a guest operation
		} else if (!authHeader) {
			// Case 2. No auth header, initial request.
			logger.trace('No Auth header, setting redirect');
			redirect = redirectUrl;
		} else {
			// Case 3. There is an auth header
			logger.trace('Got a token, checking it is valid.');

			const tokenProvider = new LocalAuthTokenProvider();

			try {
				await tokenProvider.verifyToken(authHeader);
			} catch {
				redirect = redirectUrl;
			}
		}

		return {
			willSendResponse: async ({ response }) => {
				// If we need to redirect, set the header to tell the client to do so.
				if (redirect) {
					logger.trace('Redirect set, setting X-Auth-Redirect header.');
					response.http?.headers.set('X-Auth-Redirect', redirect);
				}
			},
		};
	},
};
