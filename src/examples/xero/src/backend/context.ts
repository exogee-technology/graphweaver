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
		return token.expires_at ? +token.expires_at - Date.now() < 0 : false;
	};

	try {
		XeroBackendProvider.accessTokenProvider = {
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
