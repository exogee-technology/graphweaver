import jwt, { Algorithm, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import { logger } from '@exogee/logger';
import jwksClient from 'jwks-rsa';
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

const jwksUri = process.env.AUTH_JWKS_URI ? process.env.AUTH_JWKS_URI : undefined;

// There should be only one method to verify the token therefore we throw and error if both public key and JWKS URI are provided
if (publicKey && jwksUri) {
	throw new Error(`
    Authentication configuration error:

    Both a public key and a JWKS URI were detected. 
    Please use only one method for token verification to ensure security.

    If you intend to use an external JWKS URI, remove the 'PUBLIC_KEY' environment variable.
    If you intend to use a local public key, remove the 'JWKS_URI' environment variable.

    For more information, refer to our authentication configuration documentation: https://graphweaver.com/docs/authentication
  `);
}

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

export const isExpired = (token: JwtPayload) => !token.exp || token.exp * 1000 < Date.now();

const TOKEN_PREFIX = 'Bearer';
const algorithm = (process.env.AUTH_JWT_ALGORITHM ?? 'ES256') as Algorithm;

export class AuthTokenProvider implements BaseAuthTokenProvider {
	constructor(private authMethod?: AuthenticationMethod) {}

	getSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
		if (publicKey) return callback(null, publicKey);
		if (jwksUri) {
			const client = jwksClient({ jwksUri });
			client.getSigningKey(header?.kid, function (err, key) {
				const signingKey = key?.getPublicKey();
				callback(err, signingKey);
			});
		} else {
			callback(new Error('No public key or JWKS URI provided'));
		}
	}

	async generateToken(user: UserProfile<unknown>) {
		if (!privateKey) throw new Error('AUTH_PRIVATE_KEY_PEM_BASE64 is required in environment');
		const payload = { sub: user.id, amr: [AuthenticationMethod.PASSWORD] };

		try {
			const authToken = jwt.sign(payload, privateKey, {
				algorithm,
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
		const token = removeAuthPrefixIfPresent(authToken);
		return new Promise((resolve, reject) => {
			jwt.verify(token, this.getSigningKey, { algorithms: [algorithm] }, (err, payload) => {
				if (err) {
					logger.error(err);
					return reject(err);
				}

				if (typeof payload === 'string' || payload == undefined) {
					logger.error('JWT token payload is not an object');
					return reject('Verification of token failed');
				}

				return resolve(payload);
			});
		});
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
					algorithm,
				}
			);
			return new AuthToken(`${TOKEN_PREFIX} ${token}`);
		} catch (err) {
			logger.error(err);
			throw new Error('Token step-up failed');
		}
	}
}
