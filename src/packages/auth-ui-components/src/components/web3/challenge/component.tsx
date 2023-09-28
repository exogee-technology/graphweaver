import { useEffect, useState } from 'react';
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
import { ethers, getDefaultProvider } from 'ethers';
import Web3Token from 'web3-token';

import { ENROL_WALLET_MUTATION, VERIFY_WEB3_MUTATION } from './graphql';

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

const expiresIn = import.meta.env.VITE_ADMIN_UI_AUTH_WEB3_TOKEN_EXPIRES_IN ?? '5m';
const domain = import.meta.env.VITE_ADMIN_UI_AUTH_WEB3_TOKEN_DOMAIN ?? 'graphweaver.com';

const ConnectButton = () => {
	const { activateBrowserWallet, account } = useEthers();
	const [registerDevice, { loading }] = useMutation<{ result: { authToken: string } }>(
		ENROL_WALLET_MUTATION
	);

	const handleOnActivate = async () => {
		const provider = new ethers.providers.Web3Provider((window as any).ethereum, 'any');
		// Prompt user for account connections
		await provider.send('eth_requestAccounts', []);
		const signer = provider.getSigner();
		const token = await Web3Token.sign(async (msg: string) => await signer.signMessage(msg), {
			statement: `I want to connect my wallet to ${domain}`,
			domain,
			expires_in: expiresIn,
		});

		await registerDevice({
			variables: {
				token,
			},
		});

		activateBrowserWallet();
	};

	// 'account' means that we are connected.
	if (account) return null;
	else
		return (
			<Button type="submit" onClick={handleOnActivate} disabled={loading} loading={loading}>
				Connect Wallet
			</Button>
		);
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
			setError(undefined);

			if (library !== undefined && 'getSigner' in library && account !== undefined) {
				const signer = library.getSigner();
				const token = await Web3Token.sign(async (msg: string) => await signer.signMessage(msg), {
					statement: `Use my wallet to verify my identity.`,
					domain,
					expires_in: expiresIn,
				});

				const { data } = await verifySignature({
					variables: {
						token,
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

	// 'account' undefined means that we are not connected.
	if (!account) return null;

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
