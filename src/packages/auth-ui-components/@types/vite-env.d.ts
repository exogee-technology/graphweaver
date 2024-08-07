/// <reference types="vite/client" />

enum PrimaryAuthMethod {
	PASSWORD = 'PASSWORD',
	MAGIC_LINK = 'MAGIC_LINK',
	AUTH_ZERO = 'AUTH_ZERO',
}

enum SecondaryAuthMethod {
	PASSWORD = 'PASSWORD',
	MAGIC_LINK = 'MAGIC_LINK',
	ONE_TIME_PASSWORD = 'ONE_TIME_PASSWORD',
	WEB3 = 'WEB3',
	PASSKEY = 'PASSKEY',
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
