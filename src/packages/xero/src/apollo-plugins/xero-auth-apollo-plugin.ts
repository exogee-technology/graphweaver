import { ApolloServerPlugin } from '@apollo/server';
import { logger } from '@exogee/logger';
import { TokenSet, XeroClient } from 'xero-node';
import { GraphQLError } from 'graphql';
import { XeroBackendProvider } from '../base-resolver';

const { XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_CLIENT_REDIRECT_URIS } = process.env;
if (!XERO_CLIENT_ID) throw new Error('XERO_CLIENT_ID is required in environment');
if (!XERO_CLIENT_SECRET) throw new Error('XERO_CLIENT_SECRET is required in environment');
if (!XERO_CLIENT_REDIRECT_URIS)
	throw new Error('XERO_CLIENT_REDIRECT_URIS is required in environment');

const xero = new XeroClient({
	clientId: XERO_CLIENT_ID,
	clientSecret: XERO_CLIENT_SECRET,
	redirectUris: XERO_CLIENT_REDIRECT_URIS.split(' '),
	scopes: (
		process.env.XERO_SCOPES ||
		'openid profile email offline_access accounting.settings accounting.reports.read accounting.journals.read'
	).split(' '),
});

interface XeroTokenContext {
	xeroToken?: TokenSet;
}

export const XeroAuthApolloPlugin: ApolloServerPlugin<XeroTokenContext> = {
	async requestDidStart({ request, contextValue }) {
		logger.trace('XeroAuthApolloPlugin requestDidStart');

		XeroBackendProvider.clearTokens();

		// We have three use cases this needs to handle:
		// 1. No auth header, no code, initial request.
		//    - In this situation we need to redirect them to Xero to get a code.
		// 2. No auth header, but there is a code in the request.
		//    - In this situation we need to exchange the code for a token, then send the token back to them.
		// 3. There is an auth header
		//    - In this situation we need to verify the token, error if it's not valid then send the token back to them.
		//
		// In all situations we need to set the token in the context so the rest of the application can decide whether
		// to send data back to the client or not.

		// We may need to return a redirect to the client. If so, we'll set this variable.
		const authHeader = request.http?.headers.get('authorization');
		let redirect: string;
		let token: TokenSet | undefined = undefined;

		// Let's see if it's a valid URL as well.
		let validURL = false;
		if (authHeader) {
			try {
				new URL(authHeader);
				validURL = true;
			} catch (error) {
				logger.debug('Not a valid URL.');
			}
		}

		logger.trace('validURL: ', validURL);

		// Case 1: No header, no code, initial request.
		if (!authHeader) {
			logger.trace('No Auth header, setting redirect');
			redirect = await xero.buildConsentUrl();
		} else if (validURL) {
			logger.trace('Got a valid URL, exchanging code for token');

			// Ok, we need to exchange the code for a token.
			try {
				token = await xero.apiCallback(authHeader);
			} catch (error) {
				logger.error('Error while exchanging code for a token', error);

				// At this point we know we have a code but it's expired or it's been exchanged already.
				// The only way for the user to recover is to go through the auth flow again, so we'll
				// go ahead and get them to do that.
				token = undefined;
				redirect = await xero.buildConsentUrl();
			}
		} else {
			logger.trace('Got a token, checking for basic failures.');

			// Ok, now we need to validate the token at least on the surface.
			// Xero are the only ones who know for sure if it's good, but we can at least check the basics
			// to make sure it's not obviously invalid for users who aren't being malicious. If they are
			// being malicious, Xero won't serve data anyway, but we can provide nice messages to the user
			// for common things like expiry.
			token = new TokenSet(JSON.parse(authHeader));
			logger.trace('Token parsed successfully.');
			if (token.token_type !== 'Bearer') {
				logger.trace('Token type is not Bearer, rejecting request.');
				throw new GraphQLError('You are not authorized to perform this action.', {
					extensions: { code: 'FORBIDDEN' },
				});
			}
			if (!token.access_token || !token.id_token) {
				logger.trace('Token is missing access_token or id_token, rejecting request.');
				throw new GraphQLError('You are not authorized to perform this action.', {
					extensions: { code: 'FORBIDDEN' },
				});
			}
			if (token.expired()) {
				logger.trace('Token is expired, renewing for the user.');
				if (!xero.openIdClient) await xero.initialize();
				xero.setTokenSet(token);
				token = await xero.refreshToken();
			}
		}

		if (token) XeroBackendProvider.setTokenSet(token);

		contextValue.xeroToken = token;

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
