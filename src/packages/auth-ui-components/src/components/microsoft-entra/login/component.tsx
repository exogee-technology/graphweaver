import { useEffect } from 'react';
import {
	Button,
	localStorageAuthKey,
	localStorageRefreshTokenKey,
} from '@exogee/graphweaver-admin-ui-components';
import { useLocation } from 'wouter';
import { useMsalAuthentication, MsalProvider } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import { publicClientApplication } from '../client';

const scopes = import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES
	? import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES.split(' ')
	: ['openid', 'email', 'offline_access'];

const MicrosoftEntraInner = () => {
	const [, setLocation] = useLocation();
	const { login, result, error } = useMsalAuthentication(InteractionType.Redirect, {
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

	useEffect(() => {
		if (result?.accessToken) {
			// The user is coming back from a successful authentication redirect.
			// Save the access token
			localStorage.setItem(localStorageAuthKey, result.accessToken);

			// Extract and save the refresh token from MSAL's cache before clearing it.
			// MSAL stores refresh tokens in sessionStorage with keys containing 'refreshtoken'.
			const refreshTokenKey = Object.keys(sessionStorage).find(
				(k) => k.toLowerCase().includes('refreshtoken') && k.startsWith('msal.')
			);
			if (refreshTokenKey) {
				try {
					const refreshTokenData = JSON.parse(sessionStorage.getItem(refreshTokenKey) || '{}');
					if (refreshTokenData.secret) {
						localStorage.setItem(localStorageRefreshTokenKey, refreshTokenData.secret);
					}
				} catch {
					// If we can't parse the refresh token, continue without it
					console.warn('Could not extract refresh token from MSAL cache');
				}
			}

			// Remove all msal.* values from sessionStorage to make sure we're the
			// owners of the logged in state. We don't give a rats about your cached
			// state anymore Microsoft.
			const msalKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('msal.'));
			msalKeys.forEach((key) => sessionStorage.removeItem(key));

			// Then off we go.
			setLocation('/');
		}
	}, [result, setLocation]);

	return (
		<div>
			{error && <div>{error.message}</div>}
			<Button onClick={() => login(InteractionType.Redirect, { scopes, prompt: 'select_account' })}>
				Login
			</Button>
		</div>
	);
};

export const MicrosoftEntra = () => {
	return (
		<MsalProvider instance={publicClientApplication}>
			<MicrosoftEntraInner />
		</MsalProvider>
	);
};
