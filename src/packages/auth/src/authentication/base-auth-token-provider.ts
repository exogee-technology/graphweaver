import { JwtPayload } from 'jsonwebtoken';

export enum AuthProvider {
	LOCAL = 'LOCAL',
}

export interface BaseAuthTokenProvider {
	decodeToken: (authToken: string) => Promise<string | JwtPayload>;
}
