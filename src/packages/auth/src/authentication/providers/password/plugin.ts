import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { AuthorizationContext } from '../../../types';
import { PasswordAuthTokenProvider, isExpired } from './provider';
import { upsertAuthorizationContext } from '../../../helper-functions';
import { UserProfile } from '../../../user-profile';
import { ErrorCodes } from '../../../errors';

const redirectUrl = process.env.PASSWORD_AUTH_REDIRECT_URI;
const challengeUrl = process.env.PASSWORD_CHALLENGE_REDIRECT_URI;

const didEncounterForbiddenError = (error: any) => error.extensions.code === ErrorCodes.FORBIDDEN;
const didEncounterChallengeError = (error: any) => error.extensions.code === ErrorCodes.CHALLENGE;

export const passwordAuthApolloPlugin = (
	addUserToContext: (userId: string) => Promise<UserProfile>
): ApolloServerPlugin<AuthorizationContext> => {
	if (!redirectUrl) throw new Error('PASSWORD_AUTH_REDIRECT_URI is required in environment');

	return {
		async requestDidStart({ request, contextValue }) {
			logger.trace('PasswordAuthApolloPlugin requestDidStart');
			// We have two use cases this needs to handle:
			// 1. No auth header, initial request for a guest operation.
			//    - Some requests are allowed when accessed by a guest defined above.
			// 2. There is an auth header
			//    - In this situation we need to verify the token, error if it's not valid and redirect.
			//

			// We may need to return a redirect to the client. If so, we'll set this variable.
			const authHeader = request.http?.headers.get('authorization');
			// If verification fails then set this flag
			let tokenVerificationFailed = false;

			// Case 1. No auth header or it has expired.
			if (!authHeader || isExpired(authHeader)) {
				logger.trace('No Auth header, setting redirect');

				// We are a guest and have not logged in yet.
				contextValue.user = new UserProfile({
					id: undefined,
					roles: ['GUEST'],
				});
				upsertAuthorizationContext(contextValue);
			} else {
				// Case 2. There is a valid auth header
				logger.trace('Got a token, checking it is valid.');

				const tokenProvider = new PasswordAuthTokenProvider();

				try {
					const decoded = await tokenProvider.decodeToken(authHeader);

					const userId = typeof decoded === 'object' ? decoded?.id : undefined;
					if (!userId) throw new Error('Token verification failed: No user ID found.');
					const userProfile = await addUserToContext(userId);

					contextValue.token = decoded;
					contextValue.user = userProfile;

					upsertAuthorizationContext(contextValue);
				} catch (err: unknown) {
					logger.trace(`JWT verification failed. ${err}`);
					tokenVerificationFailed = true;
				}
			}

			return {
				willSendResponse: async ({ response, contextValue }) => {
					// Let's check if we are a guest and have received any errors
					const errors = (response.body as any)?.singleResult?.errors;

					if (contextValue.user?.roles?.includes('GUEST') && response && errors) {
						const didEncounterForbiddenErrors = errors.some(didEncounterForbiddenError);
						//If we received a forbidden error we need to redirect, set the header to tell the client to do so.
						if (didEncounterForbiddenErrors) {
							logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');
							response.http?.headers.set('X-Auth-Redirect', redirectUrl);
						}
					}

					const didEncounterChallengeErrors = errors?.some(didEncounterChallengeError);
					//If we received a challenge error we need to redirect, set the header to tell the client to do so.
					if (didEncounterChallengeErrors) {
						logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');
						if (challengeUrl) response.http?.headers.set('X-Auth-Redirect', challengeUrl);
					}

					// Let's check if verification has failed and redirect to login if it has
					if (tokenVerificationFailed) {
						logger.trace('JWT verification failed: setting X-Auth-Redirect header.');
						response.http?.headers.set('X-Auth-Redirect', redirectUrl);
					}
				},
			};
		},
	};
};
