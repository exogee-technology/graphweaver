import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { AuthenticationError } from 'apollo-server-errors';

import {
	AccessControlList,
	AuthenticationMethod,
	AuthorizationContext,
	JwtPayload,
} from '../../types';
import { AuthTokenProvider, isExpired } from '../token';
import { AclMap, requireEnvironmentVariable } from '../../helper-functions';
import { UserProfile, UserProfileType } from '../../user-profile';
import { ChallengeError, ErrorCodes, ForbiddenError, RestrictedFieldError } from '../../errors';
import { verifyPassword } from '../../utils/argon2id';
import { registerAccessControlListHook } from '../../decorators';
import { ApiKeyProvider, getApiKeyProvider } from '../methods';
import { upsertAuthorizationContext } from '../../authorization-context';
import { getAddUserToContext } from '../../user-context';
import {
	applyImplicitAllow,
	applyImplicitDeny,
	getImplicitAllow,
	setImplicitAllow,
} from '../../implicit-authorization';

export const REDIRECT_HEADER = 'X-Auth-Request-Redirect';

const didEncounterForbiddenError = (error: any): error is ForbiddenError =>
	error.extensions?.code === ErrorCodes.FORBIDDEN;
const didEncounterChallengeError = (error: any): error is ChallengeError =>
	error.extensions?.code === ErrorCodes.CHALLENGE;
const didEncounterRestrictedFieldError = (error: any): error is RestrictedFieldError =>
	error.extensions?.isRestrictedFieldError;

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

export const applyDefaultMetadataACL = () => {
	// By default we allow all users to read the admin metadata
	const defaultAcl: AccessControlList<any, AuthorizationContext> = {
		Everyone: { read: true },
	};

	const metadataEntities = [
		'AdminUiEntityAttributeMetadata',
		'AdminUiEntityMetadata',
		'AdminUiEnumMetadata',
		'AdminUiEnumValueMetadata',
		'AdminUiFieldAttributeMetadata',
		'AdminUiFieldExtensionsMetadata',
		'AdminUiFieldMetadata',
		'AdminUiFilterMetadata',
		'DetailPanelInputComponent',
	];

	for (const entity of metadataEntities) {
		if (!AclMap.has(entity)) {
			registerAccessControlListHook(entity, defaultAcl);
		}
	}
};

type AuthApolloPluginOptions<R> = {
	// @deprecated This option will be removed in the future, use setImplicitAllow instead.
	implicitAllow?: boolean;

	// @deprecated This option will be removed in the future and now happens automatically when creating an API Key auth method.
	apiKeyDataProvider?: ApiKeyProvider<R>;
};

export const authApolloPlugin = <R>(
	addUserToContext?: (userId: string, token: JwtPayload) => Promise<UserProfile<R>>,
	options?: AuthApolloPluginOptions<R>
): ApolloServerPlugin<AuthorizationContext> => {
	return {
		async requestDidStart({ request, contextValue }) {
			if (addUserToContext) {
				logger.warn(
					"WARNING: The 'addUserToContext' argument is deprecated. Please add the addUserToContext function to the request context instead."
				);
			}

			if (options?.apiKeyDataProvider) {
				logger.warn(
					"WARNING: The 'apiKeyDataProvider' argument is deprecated and will be removed in the future."
				);
			}

			if (options?.implicitAllow) {
				setImplicitAllow(options.implicitAllow);
				logger.warn(
					"WARNING: The 'implicitAllow' option is deprecated. Please use the 'setImplicitAllow' function instead."
				);
			}

			logger.trace('authApolloPlugin requestDidStart');

			// Apply the default ACL to the admin metadata
			applyDefaultMetadataACL();

			// If the implicitAllow option is set, we allow access to all entities that do not have an ACL defined.
			if (getImplicitAllow()) {
				logger.trace('Applying implicit allow');
				applyImplicitAllow();
			} else {
				// By default we deny access to all entities and the developer must define each ACL.
				logger.trace('Applying implicit deny');
				applyImplicitDeny();
			}

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
			let apiKeyVerificationFailedMessage: string | undefined = undefined;

			const apiKeyProvider = getApiKeyProvider();

			if (apiKeyHeader && apiKeyProvider) {
				// Case 1. API Key auth header found.
				logger.trace('X-API-Key header found checking validity.');

				const [key, secret] = Buffer.from(apiKeyHeader, 'base64').toString('utf-8').split(':');

				const apiKey = await apiKeyProvider?.findOne({
					key,
				});

				if (!apiKey || !apiKey.secret) {
					apiKeyVerificationFailedMessage = 'Bad Request: API Key Authentication Failed.';
					logger.error(
						`API Key Authentication Failed. No API Key was received, or it had no secret.`
					);
				} else if (apiKey.revoked) {
					apiKeyVerificationFailedMessage = 'Bad Request: API Key Authentication Failed.';
					logger.error({ apiKey }, `API Key Authentication Failed. API Key is revoked.`);
				} else if (await verifyPassword(secret, apiKey.secret)) {
					contextValue.user = new UserProfile({
						id: String(apiKey.id),
						roles: apiKey.roles ?? [],
						type: UserProfileType.SERVICE,
					});
					contextValue.token = {};
					upsertAuthorizationContext(contextValue);
				} else {
					apiKeyVerificationFailedMessage = 'Bad Request: API Key Authentication Failed.';
					logger.error(
						{ apiKey },
						`API Key Authentication Failed. Verify password call did not succeed.`
					);
				}
			} else {
				// Ok, we are working in token land at this point. We either have the following scenarios:
				// - There's no token
				// - There is a token but it's expired / invalid / whatever
				// - There is a token and it's valid
				// First step is to see if we can decode the token if there is one.
				if (!authHeader) {
					// Case 1. No auth header at all.
					logger.trace('No Auth header, treating as guest');

					// We are a guest and have not logged in yet.
					contextValue.user = new UserProfile({
						id: undefined,
						roles: ['GUEST'],
					});
					upsertAuthorizationContext(contextValue);
				} else {
					// Case 2 and 3. There is an auth header, is it valid?
					logger.trace('Got a token, checking it is valid.');

					const tokenProvider = new AuthTokenProvider();

					try {
						const decoded = await tokenProvider.decodeToken(authHeader);

						const userId = typeof decoded === 'object' ? decoded?.sub : undefined;
						if (!userId) throw new Error('Token verification failed: No user ID found.');

						if (isExpired(decoded)) throw new Error('Token verification failed: Token is expired.');

						const addUserToContextCallback = getAddUserToContext() ?? addUserToContext;
						if (!addUserToContextCallback) {
							throw new Error(
								'No addUserToContext provider please set one using the setAddUserToContext function.'
							);
						}

						const userProfile = await addUserToContextCallback(userId, decoded);

						contextValue.token = decoded;
						contextValue.user = userProfile;

						upsertAuthorizationContext(contextValue);
					} catch (err: unknown) {
						logger.error({ err }, 'JWT verification failed, treating as guest.');

						// We are a guest and have not logged in yet.
						contextValue.user = new UserProfile({
							id: undefined,
							roles: ['GUEST'],
						});
						upsertAuthorizationContext(contextValue);

						// But we still got an error and need to tell the client to redirect to login.
						tokenVerificationFailed = true;
					}
				}
			}

			return {
				didResolveOperation: async () => {
					// We throw these from here instead of above so our willSendResponse will actually get called.
					// If thrown above, we don't get to return the additional handlers, then the plugin doesn't
					// get to handle the response.
					//
					// This is early enough in the request lifecycle that the resolvers don't actually get run when
					// an error is thrown here.
					if (apiKeyVerificationFailedMessage) {
						throw new AuthenticationError(apiKeyVerificationFailedMessage);
					}
				},

				willSendResponse: async ({ response, contextValue }) => {
					// Let's check if we are a guest and have received any errors
					let errors = (response.body as any)?.singleResult?.errors;

					if (contextValue.user?.roles?.includes('GUEST') && response && errors) {
						// If we received a forbidden error we need to redirect, set the header to tell the client to do so.
						if (errors.some(didEncounterForbiddenError)) {
							logger.trace('Forbidden Error Found: setting X-Auth-Redirect header.');
							response.http.status = 200;
							response.http.headers.set(
								'X-Auth-Redirect',
								buildRedirectUri(authRedirect, RedirectType.LOGIN)
							);
						}
					}

					// If we received a challenge error we need to redirect, set the header to tell the client to do so.
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

						response.http.status = 200;
						response.http.headers.set(
							'X-Auth-Redirect',
							buildRedirectUri(authRedirect, RedirectType.CHALLENGE, [...providers])
						);
					}

					// Let's check if verification has failed and redirect to login if it has, but only if this
					// happens when we're not actually trying to log in.
					if (tokenVerificationFailed && !contextValue.skipLoginRedirect) {
						logger.trace('JWT verification failed: setting X-Auth-Redirect header.');
						response.http.status = 200;
						response.http.headers.set(
							'X-Auth-Redirect',
							buildRedirectUri(authRedirect, RedirectType.LOGIN)
						);
					}

					// Let's check if we have any Restricted Field Errors
					if (errors?.some(didEncounterRestrictedFieldError)) {
						// Here we are cleaning up the error messages to remove the empty data entity
						errors = errors?.map((error: any) => {
							if (error.extensions?.isRestrictedFieldError) {
								delete error.path;
								delete (response.body as any)?.singleResult.data;
								delete error.extensions.isRestrictedFieldError;
							}
							return error;
						});
					}
				},
			};
		},
	};
};
