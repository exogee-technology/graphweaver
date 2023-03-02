import { ForbiddenError } from 'type-graphql';
import { TokenSet } from 'xero-node';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { logger } from '@exogee/logger';
import * as fs from 'fs/promises';

export const context = async ({ event }) => {
	// Let's ensure we start with this as the default for every request.
	XeroBackendProvider.clearTokensAndProvider();

	const readTokenFromFs = async () => JSON.parse(await fs.readFile('./token.json', 'utf-8'));
	const writeTokenToFs = async (newToken: TokenSet) =>
		await fs.writeFile('./token.json', JSON.stringify(newToken, null, 4), 'utf-8');
	const expired = (token: TokenSet): boolean => {
		return Math.max((+token.expires_at ?? Date.now()) - Date.now(), 0) === 0;
	};

	/*	let token: TokenSet;
	const authHeader = event.headers['Authorization'];
	if (!authHeader) {
		// // Read from token.json. NOTE: This does at no point set the authorization header...
		// logger.trace('Context: No auth header found, reading from filesystem');
		// token = await readTokenFromFs();
		// if (!token) {
			logger.trace('Context: No auth header/fs token found, throwing ForbiddenError');
			throw new ForbiddenError();
		// }
	}
*/
	try {
		/*
		logger.trace('Context: Trying to parse token.');
		token = //new TokenSet(token) || 
			new TokenSet(JSON.parse(authHeader));
		logger.trace('Context: Token parsed successfully.');

		// We don't fully verify the JWT here, and it's (easily) possible to bypass these checks
		// by crafting a request, but Xero will validate before it gives any data back anyway, this
		// is just to to provide nice errors to the frontend for the common non-malicious scenarios.
		// If a user crafts a payload to try to fool us it still won't work, but they'll get a different
		// error message.
		logger.trace('Context: Looking for Bearer type.');
		if (token.token_type !== 'Bearer') {
			logger.trace('Context: Token type is not Bearer, throwing ForbiddenError');
			throw new ForbiddenError();
		}

		logger.trace('Context: Looking for access/id tokens.');
		if (!token.access_token || !token.id_token) {
			logger.trace('Context: Token is missing access_token or id_token, throwing ForbiddenError');
			throw new ForbiddenError();
		}

		// Calling token.expired() here throws error about 'refresh' not being defined (ffs). So use our own
		// method here. See https://github.com/panva/node-openid-client/blob/main/lib/token_set.js
		if (token.expired()) {
		// logger.trace('Context: checking expiry.');
		// if (expired(token)) {
			// try to refresh
			logger.trace('Context: Token expired. Refreshing.');
			token = await XeroBackendProvider.refreshToken();
			logger.trace('Context: Token refreshed. Writing to filesystem.');
			await writeTokenToFs(token);
			if (!token) {
				logger.trace('Context: Token is expired, could not refresh, throwing ForbiddenError');
				throw new ForbiddenError();
			}
		}
*/
		XeroBackendProvider.accessTokenProvider = {
			// get: () => token,
			// set: async (newToken) => {
			// 	token = newToken;
			// },
			get: async () => await readTokenFromFs(),
			set: async (newToken) => await writeTokenToFs(newToken),
		};

		// @todo: Where does this go?
		return { token: await readTokenFromFs() };
	} catch (error) {
		logger.error(error);
		throw new ForbiddenError();
	}
};
