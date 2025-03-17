import { useCallback, useEffect, useState } from 'react';
import { Button, localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';
import { useLocation } from 'wouter';
import { publicClientApplication } from '../client';

const scopes = import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES
	? import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES.split(' ')
	: ['openid', 'email'];

export const MicrosoftEntra = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const [, setLocation] = useLocation();

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
					setLocation('/');
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

				// The 'select_account' prompt value will ensure the user can select which account they want to sign in to, and
				// when they log out they won't be transparently logged back in without asking. It does not force them to re-enter
				// their credentials like prompt: 'login' would. If there's a better value for this setting, we'd be happy to
				// consider it, but as far as we can tell this is the only way to get the logout function to behave as a user
				// would expect it to. If we allow silent login, then when they log out, they go back to "not authed" which then
				// redirects them back to the Entra login page, which then silently logs them back in, which feels like you can't log out.
				//
				// Supported values: https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-prompt-behavior
				// Issue with the logout behaviour: https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/2547
				prompt: 'select_account',
			});
		} catch (error: any) {
			// "interaction_in_progress" is a specific error that is expected to be generated when the user is already in the process of logging out.
			// Everything works fine, so there's no reason to trouble the user with it.
			if (error.message && error.errorCode !== 'interaction_in_progress') {
				console.error(error);
				setError(error.message);
				setLoading(false);
			} else if (error.errorCode === 'interaction_in_progress') {
				console.warn('Received interaction in progress error from MSAL, ignoring...');
			}
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
