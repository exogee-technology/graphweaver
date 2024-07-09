import { useEffect, useRef } from 'react';
import { createAuth0Client } from '@auth0/auth0-spa-js';
import { localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';

const cache = {
	get: () => undefined,
	remove: () => {},
	set: (_: string, value: any) => {
		const accessToken = value?.body?.access_token;
		if (accessToken) {
			localStorage.setItem(localStorageAuthKey, `Bearer ${accessToken}`);
			const url = new URL(window.location.toString());
			const redirectUrl = url.searchParams.get('redirect_uri') ?? '/';
			window.location.href = redirectUrl;
		}
	},
};

export const Auth0 = () => {
	const shouldRedirect = useRef(true);
	useEffect(() => {
		if (shouldRedirect.current) {
			shouldRedirect.current = false;
			const init = async () => {
				const auth0Client = await createAuth0Client({
					domain: import.meta.env.VITE_AUTH_ZERO_DOMAIN,
					clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
					cache,
				});
				try {
					await auth0Client.loginWithPopup();
				} catch (e) {
					console.error(e);
				}
			};

			init();
		}
	}, []);

	return <div>Loading...</div>;
};
