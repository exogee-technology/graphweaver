import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	Spinner,
	localStorageAuthKey,
} from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { VERIFY_MAGIC_LINK_MUTATION } from './graphql';

export const MagicLinkVerify = () => {
	const [verifyMagicLink, { loading }] = useMutation<{ result: { authToken: string } }>(
		VERIFY_MAGIC_LINK_MUTATION
	);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const username = searchParams.get('username');
	if (!redirectUri) throw new Error('Missing username');

	const token = searchParams.get('token');
	if (!token) throw new Error('Missing token');

	useEffect(() => {
		const verify = async () => {
			try {
				const { data } = await verifyMagicLink({
					variables: {
						username,
						token,
					},
				});
				console.log(loading);

				const authToken = data?.result.authToken;
				if (!authToken) throw new Error('Missing auth token');

				localStorage.setItem(localStorageAuthKey, authToken);
				window.location.replace(redirectUri);
			} catch (error) {
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		};

		console.log(loading);

		if (!loading) verify();
	}, []);

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			<p>Verifying magic link...</p>
			<div>
				<Spinner />
			</div>
			{!!error && <Alert>{error.message}</Alert>}
		</div>
	);
};
