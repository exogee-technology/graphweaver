import jwt from 'jsonwebtoken';
import { logger } from '@exogee/logger';
import ms from 'ms';

import { BaseAuthTokenProvider } from '../token/base-auth-token-provider';
import { AuthToken } from '../entities/token';
import { UserProfile } from '../../user-profile';
import { AuthenticationMethod, JwtPayload } from '../../types';

const expiresIn = process.env.AUTH_JWT_EXPIRES_IN ?? '8h';
const mfaExpiresIn = process.env.AUTH_JWT_CHALLENGE_EXPIRES_IN ?? '30m';
// Decode the two environment variables above from base64 and save as vars
const publicKey = process.env.AUTH_PUBLIC_KEY_PEM_BASE64
	? Buffer.from(process.env.AUTH_PUBLIC_KEY_PEM_BASE64, 'base64').toString('ascii')
	: undefined;

const privateKey = process.env.AUTH_PRIVATE_KEY_PEM_BASE64
	? Buffer.from(process.env.AUTH_PRIVATE_KEY_PEM_BASE64, 'base64').toString('ascii')
	: undefined;

/**
 * Removes any prefix from the given authorization header.
 * The prefix is assumed to be separated from the actual token by whitespace.
 * @param authorizationHeader The authorization header string.
 * @returns The modified authorization header with the prefix removed.
 */
const removeAuthPrefixIfPresent = (authorizationHeader: string): string => {
	const prefixPattern = /^\s*[\w-]+\s+/i;
	return authorizationHeader.replace(prefixPattern, '');
};

export const isExpired = (token: string) => {
	const decodedJwt = JSON.parse(atob(token.split('.')[1]));
	return decodedJwt.exp * 1000 < Date.now();
};

const TOKEN_PREFIX = 'Bearer';

export class AuthTokenProvider implements BaseAuthTokenProvider {
	constructor(private authMethod?: AuthenticationMethod) {}

	async generateToken(user: UserProfile) {
		if (!privateKey) throw new Error('AUTH_PRIVATE_KEY_PEM_BASE64 is required in environment');
		const payload = { id: user.id, amr: [AuthenticationMethod.PASSWORD] };

		try {
			const authToken = jwt.sign(payload, privateKey, {
				algorithm: 'ES256',
				expiresIn,
			});
			const token = new AuthToken(`${TOKEN_PREFIX} ${authToken}`);
			return token;
		} catch (err) {
			logger.error(err);
			throw new Error('Could not generate token');
		}
	}

	async decodeToken(authToken: string): Promise<JwtPayload> {
		if (!publicKey) throw new Error('AUTH_PUBLIC_KEY_PEM_BASE64 is required in environment');

		const token = removeAuthPrefixIfPresent(authToken);
		let payload;
		try {
			payload = jwt.verify(token, publicKey, { algorithms: ['ES256'] });
		} catch (err) {
			logger.error(err);
			throw new Error('Verification of token failed');
		}

		if (typeof payload === 'string' || payload == undefined) {
			logger.error('JWT token payload is not an object');
			throw new Error('Verification of token failed');
		}

		return payload;
	}

	async stepUpToken(existingTokenPayload: JwtPayload) {
		if (!privateKey) throw new Error('AUTH_PRIVATE_KEY_PEM_BASE64 is required in environment');
		if (!this.authMethod) throw new Error('Please provide an authMethod in the constructor.');

		const expires = Math.floor((Date.now() + ms(mfaExpiresIn)) / 1000);

		const amr = new Set([...(existingTokenPayload.amr ?? []), this.authMethod]);

		try {
			const token = jwt.sign(
				{
					...existingTokenPayload,
					amr: [...amr],
					acr: {
						values: {
							...(existingTokenPayload.acr?.values ?? {}),
							[this.authMethod]: expires, // ACR = Authentication Context Class Reference
						},
					},
				},
				privateKey,
				{
					algorithm: 'ES256',
				}
			);
			return new AuthToken(`${TOKEN_PREFIX} ${token}`);
		} catch (err) {
			logger.error(err);
			throw new Error('Token step-up failed');
		}
	}
}
