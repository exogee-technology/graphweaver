import { Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js';
import {
	localStorageAuthKey,
	localStorageRefreshTokenKey,
} from '@exogee/graphweaver-admin-ui-components';

// We are using this cache as a hook to save the access token and refresh token in local storage
const cache = {
	get: () => undefined,
	remove: () => {},
	set: (_: string, value: any) => {
		const accessToken = value?.body?.access_token;
		if (accessToken) {
			localStorage.setItem(localStorageAuthKey, `Bearer ${accessToken}`);
		}
		const refreshToken = value?.body?.refresh_token;
		if (refreshToken) {
			localStorage.setItem(localStorageRefreshTokenKey, refreshToken);
		}
	},
};

let auth0Client: Auth0Client | undefined = undefined;

export const getAuth0Client = async () => {
	if (auth0Client) return auth0Client;

	try {
		auth0Client = await createAuth0Client({
			domain: import.meta.env.VITE_AUTH_ZERO_DOMAIN,
			clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
			cache,
		});
	} catch (err: any) {
		const message = err.message || 'Unknown error.';
		console.error('Error creating Auth0 client:', err);
		throw new Error(`Failed to create Auth0 client: ${message}`);
	}

	return auth0Client;
};
