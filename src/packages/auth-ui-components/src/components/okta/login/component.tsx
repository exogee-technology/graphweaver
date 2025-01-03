import { useEffect, useState } from 'react';
import { Button, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { useNavigate } from 'react-router-dom';
import { okta } from '../client';

const scopes = ['openid'];
if (import.meta.env.VITE_OKTA_ADDITIONAL_SCOPES) {
	scopes.push(...import.meta.env.VITE_OKTA_ADDITIONAL_SCOPES.split(','));
}

export const Okta = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				if (okta.token.isLoginRedirect()) {
					// If we're coming back from a successful login redirect, parse the tokens and set the the ID token in localStorage.
					const { tokens } = await okta.token.parseFromUrl();

					if (!tokens.accessToken) {
						throw new Error('No access token found in login redirect response.');
					}

					okta.tokenManager.setTokens(tokens);
					localStorage.setItem(localStorageAuthKey, `Bearer ${tokens.accessToken.accessToken}`);

					navigate('/');
				} else {
					// Do we have a valid user?
					const authState = okta.authStateManager.getAuthState();

					if (authState?.isAuthenticated) {
						// The user is already authenticated, so we can redirect to the home page.
						navigate('/');
					} else {
						// Otherwise, we need to go through the login flow.
						let redirectUri = window.location.origin;
						if (!redirectUri.endsWith('/')) redirectUri += '/';
						redirectUri += 'auth/login';

						await okta.token.getWithRedirect({
							scopes,
							redirectUri,
						});
					}
				}
			} catch (error: any) {
				console.error(error);
				setLoading(false);
				if (error.message) setError(error.message);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;

	return (
		<div>
			{error && <div>{error}</div>}

			{/*
			 * This button is here as a failsafe. If the component is rendered, then the user can click the button to request a login.
			 * It should never actually appear in this implementation.
			 */}
			<Button onClick={() => okta.token.getWithRedirect({ scopes })}>Login</Button>
		</div>
	);
};
