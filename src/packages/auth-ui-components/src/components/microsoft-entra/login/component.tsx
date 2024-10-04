import { useCallback, useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Button } from '@exogee/graphweaver-admin-ui-components';
import { useNavigate } from 'react-router-dom';
import { MicrosoftEntraProvider } from '../client';
import { localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';

const scopes = import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES
	? import.meta.env.VITE_MICROSOFT_ENTRA_SCOPES.split(' ')
	: ['openid', 'email'];

const LoginComponent = () => {
	const { instance } = useMsal();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				await instance.initialize();
				const tokenResponse = await instance.handleRedirectPromise();

				if (tokenResponse !== null) {
					// The user is coming back from a successful authentication redirect.
					// Save the token
					localStorage.setItem(localStorageAuthKey, tokenResponse.accessToken);

					// Then off we go.
					navigate('/');
				} else {
					// They're either just landing on the page or they're coming back from a failed login
					requestLogin();
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
			await instance.loginRedirect({ scopes });
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

export const MicrosoftEntra = () => (
	<MicrosoftEntraProvider>
		<LoginComponent />
	</MicrosoftEntraProvider>
);
