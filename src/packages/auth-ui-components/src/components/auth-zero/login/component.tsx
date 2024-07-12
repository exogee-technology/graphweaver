import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@exogee/graphweaver-admin-ui-components';
import { useNavigate } from 'react-router-dom';
import { getAuth0Client } from '../client';

export const Auth0 = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const shouldRedirect = useRef(true);
	const navigate = useNavigate();

	useEffect(() => {
		if (shouldRedirect.current) {
			shouldRedirect.current = false;
			requestLogin();
		}
	}, []);

	useEffect(() => {
		if (!loading && !error) {
			navigate('/');
		}
	}, [loading, error]);

	const requestLogin = useCallback(async () => {
		try {
			const client = await getAuth0Client();
			await client.loginWithPopup();
		} catch (e: any) {
			if (e.message) setError(e.message);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleRetry = () => {
		requestLogin();
	};

	if (loading) return <div>Loading...</div>;

	return (
		<div>
			{error && <div>{error}</div>}
			<Button onClick={handleRetry}>Retry</Button>
		</div>
	);
};
