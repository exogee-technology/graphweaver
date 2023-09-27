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
import { Config, DAppProvider, Mainnet, useEthers } from '@usedapp/core';
import { getDefaultProvider } from 'ethers';

import { VERIFY_WEB3_MUTATION } from './graphql';

import styles from './styles.module.css';

interface Form {
	code: string;
}

const config: Config = {
	readOnlyChainId: Mainnet.chainId,
	readOnlyUrls: {
		[Mainnet.chainId]: getDefaultProvider('mainnet'),
	},
};

const ConnectButton = () => {
	const { account, deactivate, activateBrowserWallet } = useEthers();
	// 'account' being undefined means that we are not connected.
	if (account) return <button onClick={() => deactivate()}>Disconnect</button>;
	else return <button onClick={() => activateBrowserWallet()}>Connect</button>;
};

const VerifyButton = () => {
	const { account, library } = useEthers();
	const [verifySignature] = useMutation<{ result: { authToken: string } }>(VERIFY_WEB3_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleSignMessage = async () => {
		try {
			console.log(library, account);
			if (library !== undefined && 'getSigner' in library && account !== undefined) {
				const signer = library.getSigner();
				const signedMessage = await signer.signMessage(`gw-${new Date().toISOString()}`);

				console.log(signedMessage);

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
	);
};

export const Web3Challenge = () => {
	return (
		<DAppProvider config={config}>
			<div className={styles.wrapper}>
				<div>
					<GraphweaverLogo width="52" className={styles.logo} />
				</div>
				<ConnectButton />
				<VerifyButton />
			</div>
		</DAppProvider>
	);
};
