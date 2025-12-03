import { PublicClientApplication } from '@azure/msal-browser';

export const publicClientApplication = new PublicClientApplication({
	auth: {
		clientId: import.meta.env.VITE_MICROSOFT_ENTRA_CLIENT_ID,
		authority: import.meta.env.VITE_MICROSOFT_ENTRA_TENANT_ID
			? `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_ENTRA_TENANT_ID}`
			: undefined,
	},
	cache: {
		// This is the default, however we are managing these keys on login manually
		// so we're specifying this to make absolutely sure the session state stays
		// where we expect it to be.
		cacheLocation: 'sessionStorage',
	},
});
