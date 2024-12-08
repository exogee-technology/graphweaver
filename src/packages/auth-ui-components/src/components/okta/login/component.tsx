import { useEffect, useState } from 'react';
import { Button, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { useNavigate } from 'react-router-dom';
import { okta } from '../client';
import { AccessToken, IDToken } from '@okta/okta-auth-js';

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
				// If we're coming back from a successful login redirect, parse the tokens and set them
				if (okta.token.isLoginRedirect()) {
					const { tokens } = await okta.token.parseFromUrl();
					if (!tokens.accessToken) {
						throw new Error('No access token found in login redirect response.');
					}

					okta.tokenManager.setTokens(tokens);
					localStorage.setItem(localStorageAuthKey, tokens.accessToken.accessToken);
				}

				const accessToken = (await okta.tokenManager.get('accessToken')) as AccessToken | undefined;
				const idToken = (await okta.tokenManager.get('idToken')) as IDToken | undefined;
				let userInfo;
				if (accessToken && idToken) {
					userInfo = await okta.token.getUserInfo(accessToken, idToken);
				}

				if (userInfo) {
					// If there's a user we can go ahead and navigate to the home page.
					navigate('/');
				} else {
					// Otherwise, we need to go through the login flow.
					await okta.token.getWithRedirect({ scopes });
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
