export * from './password/resolver';
export * from './magic-link/resolver';
export * from './one-time-password/resolver';
export * from './web3/resolver';
export * from './passkey/resolver';

export enum AuthenticationType {
	PasskeyChallenge = 'PasskeyChallenge',
	PasskeyAuthenticator = 'PasskeyAuthenticator',
	Web3WalletAddress = 'Web3WalletAddress',
	OTPChallenge = 'OTPChallenge',
}
