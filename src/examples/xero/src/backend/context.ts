import { ForbiddenError } from 'type-graphql';
import { TokenSet } from 'xero-node';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { logger } from '@exogee/logger';

export const context = async ({ event }) => {
	// Let's ensure we start with this as the default for every request.
	XeroBackendProvider.clearTokensAndProvider();

	const authHeader = event.headers['Authorization'];
	if (!authHeader) {
		logger.trace('No auth header found, throwing ForbiddenError');
		throw new ForbiddenError();
	}

	try {
		logger.trace('Trying to parse token.');
		let token = new TokenSet(JSON.parse(authHeader));
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

		if (token.expired()) {
			logger.trace('Token is expired, throwing ForbiddenError');
			throw new ForbiddenError();
		}

		XeroBackendProvider.accessTokenProvider = {
			get: () => token,
			set: async (newToken) => {
				token = newToken;
			},
		};

		return { token };
	} catch (error) {
		logger.error(error);
		throw new ForbiddenError();
	}
};
