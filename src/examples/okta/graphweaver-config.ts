import { defineConfig, PrimaryAuthMethod } from '@exogee/graphweaver-config';

export default defineConfig({
	adminUI: {
		auth: {
			primaryMethods: [PrimaryAuthMethod.OKTA],
		},
	},
});
