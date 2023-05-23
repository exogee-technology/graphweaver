import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { AuthorizationContext } from '../../../types';
import { LocalAuthTokenProvider } from './provider';
import { upsertAuthorizationContext } from '../../../helper-functions';
import { LocalAuthResolver } from './resolver';
import { UserProfile } from '../../user-profile';

if (!process.env.LOCAL_AUTH_REDIRECT_URI)
	throw new Error('LOCAL_AUTH_REDIRECT_URI is required in environment');

const redirectUrl = process.env.LOCAL_AUTH_REDIRECT_URI;
const guestOperations = ['login'];

export const localAuthApolloPlugin = (
	getUserProfile: (userId: string) => Promise<UserProfile>
): ApolloServerPlugin<AuthorizationContext> => ({
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
				const decoded = await tokenProvider.decodeToken(authHeader);

				const userId = typeof decoded === 'object' ? decoded?.id : undefined;
				const userProfile = await getUserProfile(userId);

				contextValue.token = decoded;
				contextValue.roles = userProfile.roles;

				upsertAuthorizationContext(contextValue);
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
});
