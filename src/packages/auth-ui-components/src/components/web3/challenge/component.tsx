import { useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	localStorageAuthKey,
	Button,
	Spinner,
} from '@exogee/graphweaver-admin-ui-components';
import { Form, Formik } from 'formik';
import { Config, DAppProvider, Mainnet, useEthers } from '@usedapp/core';
import { ethers, getDefaultProvider } from 'ethers';
import Web3Token from 'web3-token';

import { CAN_ENROL_WALLET_QUERY, ENROL_WALLET_MUTATION, VERIFY_WEB3_MUTATION } from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';

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
	const { activateBrowserWallet, account: walletConnected } = useEthers();
	const [registerDevice, { loading }] = useMutation<{
		result: { authToken: string };
	}>(ENROL_WALLET_MUTATION);

	const handleOnActivate = useCallback(async () => {
		const provider = new ethers.providers.Web3Provider((window as any).ethereum, 'any');
		// Prompt user for account connections
		await provider.send('eth_requestAccounts', []);
		const signer = provider.getSigner();
		const token = await Web3Token.sign(async (msg: string) => await signer.signMessage(msg), {
			statement: `Use my wallet to verify my identity on ${domain}.`,
			domain,
			expires_in: expiresIn,
		});

		await registerDevice({
			variables: {
				token,
			},
		});

		activateBrowserWallet();
	}, [registerDevice, activateBrowserWallet]);

	if (walletConnected) return null;
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
	const navigate = useNavigate();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleSignMessage = useCallback(async () => {
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

				navigate(formatRedirectUrl(redirectUri), { replace: true });
			}
		} catch (error) {
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	}, [library, verifySignature, navigate, account]);

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

const ConnectAndVerifyButtons = () => {
	const { account } = useEthers();

	// This checks if we can register a wallet and redirects if we cant
	const walletConnected = !!account;
	const { data, loading } = useQuery<{ canEnrolWallet: boolean }>(CAN_ENROL_WALLET_QUERY, {
		skip: walletConnected,
	});

	if (!walletConnected && (!data?.canEnrolWallet || loading)) return <Spinner />;

	return (
		<>
			<ConnectButton />
			<VerifyButton />
		</>
	);
};

export const Web3Challenge = () => {
	return (
		<DAppProvider config={config}>
			<div className={styles.wrapper}>
				<div>
					<GraphweaverLogo width="52" className={styles.logo} />
				</div>
				<ConnectAndVerifyButtons />
			</div>
		</DAppProvider>
	);
};
