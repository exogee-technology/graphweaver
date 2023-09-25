import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	REDIRECT_HEADER,
	Spinner,
	localStorageAuthKey,
} from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { SEND_MAGIC_LINK_MUTATION, VERIFY_MAGIC_LINK_MUTATION } from './graphql';

export const MagicLinkChallenge = () => {
	const [sendMagicLink] = useMutation<{ result: boolean }>(SEND_MAGIC_LINK_MUTATION);
	const [verifyMagicLink] = useMutation<{ result: { authToken: string } }>(
		VERIFY_MAGIC_LINK_MUTATION
	);
	const initialized = useRef(false);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const token = searchParams.get('token');

	useEffect(() => {
		const sendLink = async () => {
			try {
				initialized.current = true;

				await sendMagicLink({
					context: {
						headers: {
							[REDIRECT_HEADER]: redirectUri,
						},
					},
				});
			} catch (error) {
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		};

		const verifyLink = async () => {
			try {
				initialized.current = true;

				const { data } = await verifyMagicLink({
					variables: {
						token,
					},
				});

				const authToken = data?.result.authToken;
				if (!authToken) throw new Error('Missing auth token');

				localStorage.setItem(localStorageAuthKey, authToken);
				window.location.replace(redirectUri);
			} catch (error) {
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		};

		if (!initialized.current && !token) sendLink();
		if (!initialized.current && token) verifyLink();
	}, []);

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			{error ? (
				<Alert>{error.message}</Alert>
			) : token ? (
				<Spinner />
			) : (
				<p className={styles.sent}>
					We&#39;ve sent an email to you that contains a link, click it to perform this operation.
				</p>
			)}
		</div>
	);
};
