import { JwtPayload } from 'jsonwebtoken';
import { AuthToken } from './schema';
import { UserProfile } from '../user-profile';

export enum AuthProvider {
	PASSWORD = 'PASSWORD',
}

export interface BaseAuthTokenProvider {
	generateToken: (user: UserProfile) => Promise<AuthToken>;
	decodeToken: (authToken: string) => Promise<string | JwtPayload>;
	stepUpToken: (user: UserProfile) => Promise<AuthToken>;
}
