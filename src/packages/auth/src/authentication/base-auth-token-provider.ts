export enum AuthProvider {
	LOCAL = 'LOCAL',
}

export interface BaseAuthTokenProvider {
	verifyToken: (authToken: string) => Promise<boolean>;
}
