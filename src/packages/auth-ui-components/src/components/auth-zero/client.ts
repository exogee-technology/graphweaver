import { Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js';
import { localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';

// We are using this cache as a hook to save the access token in the local storage
const cache = {
	get: () => undefined,
	remove: () => {},
	set: (_: string, value: any) => {
		const accessToken = value?.body?.access_token;
		if (accessToken) {
			localStorage.setItem(localStorageAuthKey, `Bearer ${accessToken}`);
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
	} catch (err) {
		console.error(err);
		throw new Error('Failed to create Auth0 client');
	}

	return auth0Client;
};
