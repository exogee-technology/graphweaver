import { useCallback, useEffect, useState } from 'react';
import { Button, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { useNavigate } from 'react-router-dom';
import { publicClientApplication } from '../client';

const scopes = import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES
	? import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES.split(' ')
	: ['openid', 'email'];

export const MicrosoftEntra = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				await publicClientApplication.initialize();
				const tokenResponse = await publicClientApplication.handleRedirectPromise();

				if (tokenResponse !== null) {
					// The user is coming back from a successful authentication redirect.
					// Save the token
					localStorage.setItem(localStorageAuthKey, tokenResponse.accessToken);

					// Then off we go.
					navigate('/');
				} else {
					// They're either just landing on the page or they're coming back from a failed login
					await requestLogin();
				}
			} catch (error: any) {
				console.error(error);
				setLoading(false);
				if (error.message) setError(error.message);
			}
		})();
	}, []);

	// This function is called when the user clicks the login button or when the user is coming to the page for the first time
	const requestLogin = useCallback(async () => {
		try {
			await publicClientApplication.loginRedirect({
				scopes,

				// Prompt: 'login' will ensure the user can select which account they want to sign in to, and when they log out
				// they won't be transparently logged back in without asking. If there's a better value for this setting, we'd be
				// happy to consider it, but as far as we can tell this is the only way to get the logout function to behave as
				// a user would expect it to.
				// https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/2547
				prompt: 'login',
			});
		} catch (error: any) {
			if (error.message) setError(error.message);
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
