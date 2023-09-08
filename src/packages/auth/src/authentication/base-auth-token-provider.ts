import { JwtPayload } from 'jsonwebtoken';
import { AuthToken } from './schema';
import { UserProfile } from '../user-profile';

export enum AuthProvider {
	LOCAL = 'LOCAL',
}

export interface BaseAuthTokenProvider {
	generateToken: (user: UserProfile) => Promise<AuthToken>;
	decodeToken: (authToken: string) => Promise<string | JwtPayload>;
}
