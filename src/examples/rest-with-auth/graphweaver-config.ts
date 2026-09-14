import { defineConfig, PrimaryAuthMethod, SecondaryAuthMethod } from '@exogee/graphweaver-config';

export default defineConfig({
	adminUI: {
		auth: {
			primaryMethods: [PrimaryAuthMethod.PASSWORD],
			secondaryMethods: [
				SecondaryAuthMethod.ONE_TIME_PASSWORD,
				SecondaryAuthMethod.MAGIC_LINK,
				SecondaryAuthMethod.WEB3,
				SecondaryAuthMethod.PASSKEY,
			],
		},
	},
});
