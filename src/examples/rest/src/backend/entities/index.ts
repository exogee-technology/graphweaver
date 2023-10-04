import {
	Credential,
	Task,
	Tag,
	MagicLink,
	OneTimePassword,
	Device,
	PasskeyAuthenticator,
	PasskeyChallenge,
} from './mysql';

export * from './rest';
export * from './mysql';

export const databaseEntities = [
	Credential,
	Task,
	Tag,
	MagicLink,
	OneTimePassword,
	Device,
	PasskeyAuthenticator,
	PasskeyChallenge,
];
