import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@exogee/graphweaver-admin-ui-components';
import { useLocation, useSearchParams } from 'wouter';
import { getAuth0Client } from '../client';

export const Auth0 = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();

	const [searchParams] = useSearchParams();
	const shouldRedirect = useRef(true);
	const [, setLocation] = useLocation();

	// In this effect we are checking if the user is coming back from the Auth0 login page or
	// if the user is coming to the page for the first time. If the user is coming back from
	// the Auth0 login page, we process the redirect. If the user is coming to the page for the
	// first time, we redirect the user to the Auth0 login page.
	useEffect(() => {
		if (shouldRedirect.current) {
			shouldRedirect.current = false;
			const code = searchParams.get('code');
			const state = searchParams.get('state');

			if (code && state) {
				// The user is coming back from the Auth0 login page
				processRedirect();
			} else {
				// The user is coming to the page for the first time
				requestLogin();
			}
		}
	}, []);

	// This function is called when the user clicks the login button or when the user is coming to the page for the first time
	const requestLogin = useCallback(async () => {
		try {
			const client = await getAuth0Client();
			const options = {
				authorizationParams: {
					redirect_uri: window.location.toString(),
					scope: 'openid profile email offline_access',
				},
			};
			await client.loginWithRedirect(options);
		} catch (e: any) {
			if (e.message) setError(e.message);
			setLoading(false);
		}
	}, []);

	// This function is called when the user is coming back from the Auth0 login page and we need to process the redirect
	// This function will handle the redirect and redirect the user to the home page
	const processRedirect = useCallback(async () => {
		try {
			const client = await getAuth0Client();
			await client.handleRedirectCallback();
			setLocation('/');
		} catch (e: any) {
			if (e.message) setError(e.message);
		} finally {
			setLoading(false);
		}
	}, []);

	if (loading) return <div>Loading...</div>;

	return (
		<div>
			{error && <div>{error}</div>}
			<Button onClick={requestLogin}>Login</Button>
		</div>
	);
};
