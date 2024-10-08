/// <reference types="vite/client" />

enum PrimaryAuthMethod {
	AUTH_ZERO = 'AUTH_ZERO',
	MAGIC_LINK = 'MAGIC_LINK',
	MICROSOFT_ENTRA = 'MICROSOFT_ENTRA',
	PASSWORD = 'PASSWORD',
}

enum SecondaryAuthMethod {
	MAGIC_LINK = 'MAGIC_LINK',
	ONE_TIME_PASSWORD = 'ONE_TIME_PASSWORD',
	PASSKEY = 'PASSKEY',
	PASSWORD = 'PASSWORD',
	WEB3 = 'WEB3',
}

interface AdminUIAuthOptions {
	primaryMethods: PrimaryAuthMethod[];
	secondaryMethods: SecondaryAuthMethod[];
	password: {
		enableForgottenPassword: boolean;
		enableResetPassword: boolean;
	};
}

interface AdminUIOptions {
	customPagesPath: string;
	customFieldsPath: string;
	auth?: AdminUIAuthOptions;
}

interface ImportMetaEnv {
	readonly VITE_GRAPHWEAVER_CONFIG: AdminUIOptions;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
