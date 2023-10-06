import {
	Credential,
	Task,
	Tag,
	Authentication,
	MagicLink,
	OneTimePassword,
	Device,
	PasskeyAuthenticator,
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
	Authentication,
];
