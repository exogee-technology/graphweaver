export enum AuthProvider {
	LOCAL = 'LOCAL',
}

export interface BaseAuthProvider {
	verifyAuthToken: (authToken: string) => Promise<boolean>;
}
