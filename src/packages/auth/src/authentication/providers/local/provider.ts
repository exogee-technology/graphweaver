import jwt from 'jsonwebtoken';

import { BaseAuthTokenProvider } from '../../base-auth-token-provider';
import { AuthToken } from '../../schema/token';
import { UserProfile } from '../../user-profile';

const secret = process.env.JWT_SECRET;
const expiresIn = '8h'; // @todo - this is too long but setting to 8 hours until we define refresh tokens

export class LocalAuthTokenProvider implements BaseAuthTokenProvider {
	async generateToken(user: UserProfile) {
		if (!secret) throw new Error('No JWT Secret has been set');
		// @todo Currently, using HMAC SHA256 look to support RSA SHA256
		const authToken = jwt.sign({ id: user.id }, secret, { expiresIn });
		const token = new AuthToken(authToken);
		return token;
	}
	async verifyToken(authToken: string) {
		if (!secret) throw new Error('No JWT Secret has been set');
		const decoded = jwt.verify(authToken, secret);
		return !!decoded;
	}
}
