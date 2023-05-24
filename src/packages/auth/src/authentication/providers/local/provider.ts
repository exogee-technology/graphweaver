import jwt from 'jsonwebtoken';

import { BaseAuthTokenProvider } from '../../base-auth-token-provider';
import { AuthToken } from '../../schema/token';
import { UserProfile } from '../../../user-profile';

if (!process.env.LOCAL_AUTH_JWT_SECRET)
	throw new Error('LOCAL_AUTH_JWT_SECRET is required in environment');

const secret = process.env.LOCAL_AUTH_JWT_SECRET;
const expiresIn = process.env.LOCAL_AUTH_JWT_EXPIRES_IN ?? '8h';

export class LocalAuthTokenProvider implements BaseAuthTokenProvider {
	async generateToken(user: UserProfile) {
		// @todo Currently, using HMAC SHA256 look to support RSA SHA256
		const authToken = jwt.sign({ id: user.id }, secret, { expiresIn });
		const token = new AuthToken(authToken);
		return token;
	}
	async decodeToken(authToken: string) {
		return jwt.verify(authToken, secret);
	}
}
