import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';

import { AuthenticationMethod, AuthorizationContext } from '../../types';
import { AuthTokenProvider, isExpired } from '../token';
import { requireEnvironmentVariable, upsertAuthorizationContext } from '../../helper-functions';
import { UserProfile } from '../../user-profile';
import { ChallengeError, ErrorCodes, ForbiddenError } from '../../errors';
import { AuthenticationError } from 'apollo-server-errors';
import { verifyPassword } from '../../utils/argon2id';
import { BackendProvider } from '@exogee/graphweaver';
import { ApiKey, ApiKeyStorage } from '../entities';

export const REDIRECT_HEADER = 'X-Auth-Request-Redirect';

const didEncounterForbiddenError = (error: any): error is ForbiddenError =>
	error.extensions.code === ErrorCodes.FORBIDDEN;
const didEncounterChallengeError = (error: any): error is ChallengeError =>
	error.extensions.code === ErrorCodes.CHALLENGE;

enum RedirectType {
	CHALLENGE = 'challenge',
	LOGIN = 'login',
}

const buildRedirectUri = (
	redirect: URL,
	type: RedirectType,
	providers?: AuthenticationMethod[]
) => {
	const url = new URL(redirect.origin);
	url.pathname = `auth/${type}`;
	const params = new URLSearchParams();
	params.set('redirect_uri', redirect.toString());
	if (providers) params.set('providers', providers.join(','));
	url.search = params.toString();
	return url.toString();
};

const isURLWhitelisted = (authRedirect: URL) => {
	const whitelist = requireEnvironmentVariable('AUTH_WHITELIST_DOMAINS')?.split?.(' ');

	const redirectDomain = authRedirect.hostname.toLowerCase();
	// Check if the current domain matches any domain in the whitelist
	return whitelist.some((whitelistedDomain) =>
		redirectDomain.includes(whitelistedDomain.toLowerCase())
	);
};

export const authApolloPlugin = <D extends ApiKeyStorage>(
	addUserToContext: (userId: string) => Promise<UserProfile>,
	provider?: BackendProvider<D, ApiKey<D>>
): ApolloServerPlugin<AuthorizationContext> => {
	return {
		async requestDidStart({ request, contextValue }) {
			logger.trace('authApolloPlugin requestDidStart');
			// We have two use cases this needs to handle:
			// 1. No auth header, initial request for a guest operation.
			//    - Some requests are allowed when accessed by a guest defined above.
			// 2. There is an auth header
			//    - In this situation we need to verify the token, error if it's not valid and redirect.
			//

			// We may need to return a redirect to the client. If so, we'll set this variable.
			const authHeader = request.http?.headers.get('authorization');
			const apiKeyHeader = request.http?.headers.get('X-API-Key');
			const authRedirect = new URL(
				request.http?.headers.get(REDIRECT_HEADER) ?? requireEnvironmentVariable('AUTH_BASE_URI')
			);

			// Check that we are allowed to redirect to this domain
			if (authRedirect && !isURLWhitelisted(authRedirect)) {
				throw new Error('Authentication Failed: Unknown redirect URI.');
			}
			if (authRedirect) contextValue.redirectUri = authRedirect;

			// If verification fails then set this flag
			let tokenVerificationFailed = false;

			if (apiKeyHeader && provider) {
				// Case 1. API Key auth header found.
				logger.trace('X-API-Key header found checking validity.');

				const credentials = Buffer.from(apiKeyHeader, 'base64').toString('utf-8').split(':');
				const key = credentials[0];
				const secret = credentials[1];

				const apiKey = await provider?.findOne({
					key,
				});

				if (!apiKey) throw new AuthenticationError('Bad Request: Authentication Failed. (E0001)');
				if (!apiKey.secret)
					throw new AuthenticationError('Bad Request: Authentication Failed. (E0002)');
				if (!apiKey.revoked)
					throw new AuthenticationError('Bad Request: Authentication Failed. (E0003)');

				if (await verifyPassword(secret, apiKey.secret)) {
					// We are a guest and have not logged in yet.
					contextValue.user = new UserProfile({
						id: key,
						roles: ['SYSTEM_USER'],
					});
					upsertAuthorizationContext(contextValue);
				} else {
					throw new AuthenticationError('Bad Request: Authentication Failed. (E0004)');
				}
			} else if (!authHeader || isExpired(authHeader)) {
				// Case 1. No auth header or it has expired.
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

				const tokenProvider = new AuthTokenProvider();

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
						//If we received a forbidden error we need to redirect, set the header to tell the client to do so.
						if (errors.some(didEncounterForbiddenError)) {
							logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');
							response.http?.headers.set(
								'X-Auth-Redirect',
								buildRedirectUri(authRedirect, RedirectType.LOGIN)
							);
						}
					}

					//If we received a challenge error we need to redirect, set the header to tell the client to do so.
					if (errors?.some(didEncounterChallengeError)) {
						logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');

						// Find all the providers listed in the challenge errors
						const providers: Set<AuthenticationMethod> = errors.reduce(
							(acc: Set<AuthenticationMethod>, error: ChallengeError | unknown) => {
								if (didEncounterChallengeError(error))
									return new Set([...acc, ...error.extensions.providers]);
								return acc;
							},
							new Set<AuthenticationMethod>()
						);

						response.http?.headers.set(
							'X-Auth-Redirect',
							buildRedirectUri(authRedirect, RedirectType.CHALLENGE, [...providers])
						);
					}

					// Let's check if verification has failed and redirect to login if it has
					if (tokenVerificationFailed) {
						logger.trace('JWT verification failed: setting X-Auth-Redirect header.');
						response.http?.headers.set(
							'X-Auth-Redirect',
							buildRedirectUri(authRedirect, RedirectType.LOGIN)
						);
					}
				},
			};
		},
	};
};
