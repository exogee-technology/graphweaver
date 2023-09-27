import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	localStorageAuthKey,
	Button,
} from '@exogee/graphweaver-admin-ui-components';
import { Form, Formik } from 'formik';
import { useEthers } from '@usedapp/core';

import styles from './styles.module.css';

import { VERIFY_WEB3_MUTATION } from './graphql';

interface Form {
	code: string;
}

const ConnectButton = () => {
	const { account, deactivate, activateBrowserWallet } = useEthers();
	// 'account' being undefined means that we are not connected.
	if (account) return <button onClick={() => deactivate()}>Disconnect</button>;
	else return <button onClick={() => activateBrowserWallet()}>Connect</button>;
};

export const Web3Challenge = () => {
	const { account, library } = useEthers();
	const [verifySignature] = useMutation<{ result: { authToken: string } }>(VERIFY_WEB3_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleSignMessage = async () => {
		try {
			if (library !== undefined && 'getSigner' in library && account !== undefined) {
				const signer = library.getSigner();
				const signedMessage = await signer.signMessage('Message');

				const { data } = await verifySignature({
					variables: {
						signedMessage,
					},
				});

				const authToken = data?.result.authToken;
				if (!authToken) throw new Error('Missing auth token');

				localStorage.setItem(localStorageAuthKey, authToken);
				window.location.replace(redirectUri);
			}
		} catch (error) {
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			<ConnectButton />
			<Formik<Form> initialValues={{ code: '' }} onSubmit={handleSignMessage}>
				{({ isSubmitting }) => (
					<Form className={styles.wrapper}>
						<div className={styles.titleContainerCenter}>Verify Wallet</div>
						<div className={styles.buttonContainerCenter}>
							<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
								Verify
							</Button>
						</div>
						{!!error && <Alert>{error.message}</Alert>}
					</Form>
				)}
			</Formik>
		</div>
	);
};
