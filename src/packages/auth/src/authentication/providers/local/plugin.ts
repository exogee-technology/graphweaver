import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { AuthorizationContext } from '../../../types';
import { LocalAuthTokenProvider } from './provider';
import { upsertAuthorizationContext } from '../../../helper-functions';
import { UserProfile } from '../../../user-profile';
import { ForbiddenError } from 'apollo-server-errors';
import { AuthProvider } from '../../base-auth-token-provider';
import { GraphQLError } from 'graphql';

if (!process.env.LOCAL_AUTH_REDIRECT_URI)
	throw new Error('LOCAL_AUTH_REDIRECT_URI is required in environment');

const redirectUrl = process.env.LOCAL_AUTH_REDIRECT_URI;

const didEncounterForbiddenError = (error: any) => {
	return error.extensions.code === 'FORBIDDEN';
};

export const localAuthApolloPlugin = (
	getUserProfile: (userId: string) => Promise<UserProfile>
): ApolloServerPlugin<AuthorizationContext> => ({
	async requestDidStart({ request, contextValue }) {
		logger.trace('LocalAuthApolloPlugin requestDidStart');
		// We have two use cases this needs to handle:
		// 1. No auth header, initial request for a guest operation.
		//    - Some requests are allowed when accessed by a guest defined above.
		// 2. There is an auth header
		//    - In this situation we need to verify the token, error if it's not valid and redirect.
		//

		// We may need to return a redirect to the client. If so, we'll set this variable.
		const authHeader = request.http?.headers.get('authorization');
		// If verification fails then set this flag
		let verificationFailed = false;

		// Case 1. No auth header, initial request for a guest operation.
		if (!authHeader) {
			// Case 2. No auth header, initial request.
			logger.trace('No Auth header, setting redirect');

			// We are a guest and have not logged in yet.
			contextValue.user = new UserProfile({
				id: undefined,
				roles: ['GUEST'],
				provider: AuthProvider.LOCAL,
			});
			upsertAuthorizationContext(contextValue);
		} else {
			// Case 3. There is an auth header
			logger.trace('Got a token, checking it is valid.');

			const tokenProvider = new LocalAuthTokenProvider();

			try {
				const decoded = await tokenProvider.decodeToken(authHeader);

				const userId = typeof decoded === 'object' ? decoded?.id : undefined;
				const userProfile = await getUserProfile(userId);

				contextValue.token = decoded;
				contextValue.user = userProfile;

				upsertAuthorizationContext(contextValue);
			} catch (err: unknown) {
				logger.trace(`JWT verification failed. ${err}`);
				verificationFailed = true;
			}
		}

		return {
			willSendResponse: async ({ response, contextValue }) => {
				// Let's check if we are a guest and have received a forbidden error
				if (
					contextValue.user?.roles?.includes('GUEST') &&
					response &&
					(response.body as any)?.singleResult?.errors
				) {
					const didEncounterForbiddenErrors = (response.body as any)?.singleResult?.errors.some(
						didEncounterForbiddenError
					);
					//If we received a forbidden error we need to redirect, set the header to tell the client to do so.
					if (didEncounterForbiddenErrors) {
						logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');
						response.http?.headers.set('X-Auth-Redirect', redirectUrl);
					}
				}

				// Let's check if verification has failed and redirect to login if it has
				if (verificationFailed) {
					logger.trace('JWT verification failed: setting X-Auth-Redirect header.');
					response.http?.headers.set('X-Auth-Redirect', redirectUrl);
				}
			},
		};
	},
});
