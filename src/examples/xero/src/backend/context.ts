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
		return Math.max((+token.expires_at ?? Date.now()) - Date.now()) === 0;
	};

	let token: TokenSet;
	const authHeader = event.headers['Authorization'];
	if (!authHeader) {
		// Read from token.json. NOTE: This does at no point set the authorization header...
		token = await readTokenFromFs();
		if (!token) {
			logger.trace('No auth header found, throwing ForbiddenError');
			throw new ForbiddenError();
		}
	}

	try {
		logger.trace('Trying to parse token.');
		token = new TokenSet(token) || new TokenSet(JSON.parse(authHeader));
		logger.trace('Token parsed successfully.');

		// We don't fully verify the JWT here, and it's (easily) possible to bypass these checks
		// by crafting a request, but Xero will validate before it gives any data back anyway, this
		// is just to to provide nice errors to the frontend for the common non-malicious scenarios.
		// If a user crafts a payload to try to fool us it still won't work, but they'll get a different
		// error message.
		if (token.token_type !== 'Bearer') {
			logger.trace('Token type is not Bearer, throwing ForbiddenError');
			throw new ForbiddenError();
		}

		if (!token.access_token || !token.id_token) {
			logger.trace('Token is missing access_token or id_token, throwing ForbiddenError');
			throw new ForbiddenError();
		}

		// Calling token.expired() here throws error about 'refresh' not being defined (ffs). So use our own
		// method here. See https://github.com/panva/node-openid-client/blob/main/lib/token_set.js
		// if (token.expired()) {
		if (expired(token)) {
			// try to refresh
			token = await XeroBackendProvider.refreshToken();
			await writeTokenToFs(token);
			if (!token) {
				logger.trace('Token is expired, throwing ForbiddenError');
				throw new ForbiddenError();
			}
		}

		XeroBackendProvider.accessTokenProvider = {
			get: () => token,
			set: async (newToken) => {
				token = newToken;
			},
		};

		// @todo: Where does this go?
		return { token };
	} catch (error) {
		logger.error(error);
		throw new ForbiddenError();
	}
};
