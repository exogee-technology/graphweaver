import { JwtPayload } from 'jsonwebtoken';
import { AuthToken } from './schema';
import { UserProfile } from '../user-profile';

export interface BaseAuthTokenProvider {
	generateToken: (user: UserProfile) => Promise<AuthToken>;
	decodeToken: (authToken: string) => Promise<JwtPayload>;
	stepUpToken: (user: UserProfile, existingTokenPayload: JwtPayload) => Promise<AuthToken>;
}
