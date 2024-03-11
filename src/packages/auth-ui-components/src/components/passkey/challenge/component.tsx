import { useCallback, useState, Dispatch } from 'react';
import { useMutation } from '@apollo/client';
import {
	Alert,
	Button,
	GraphweaverLogo,
	localStorageAuthKey,
	Spinner,
} from '@exogee/graphweaver-admin-ui-components';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import { Form, Formik } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
	GENERATE_AUTHENTICATION_OPTIONS,
	GENERATE_REGISTRATION_OPTIONS,
	VERIFY_AUTHENTICATION_RESPONSE,
	VERIFY_REGISTRATION_RESPONSE,
} from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';

import styles from './styles.module.css';

const passkeyAutoConnectFlag = 'passkey:autoConnectTag';

interface Form {
	code: string;
}

const RegisterButton = ({
	setError,
	autoConnect,
	setAutoConnect,
}: {
	setError: Dispatch<React.SetStateAction<Error | undefined>>;
	autoConnect: string | null;
	setAutoConnect: Dispatch<React.SetStateAction<string | null>>;
}) => {
	const [generateRegistrationOptions, { loading: generateLoading }] = useMutation<{
		passkeyGenerateRegistrationOptions: PublicKeyCredentialCreationOptionsJSON;
	}>(GENERATE_REGISTRATION_OPTIONS);

	const [verifyRegistrationResponse, { loading: verifyLoading }] = useMutation<{
		passkeyVerifyRegistrationResponse: boolean;
	}>(VERIFY_REGISTRATION_RESPONSE);

	const loading = generateLoading || verifyLoading;

	const setPasskeyAutoConnect = useCallback(() => {
		localStorage.setItem(passkeyAutoConnectFlag, 'true');
		setAutoConnect('true');
	}, [setAutoConnect]);

	const handleOnRegister = useCallback(async () => {
		try {
			const { data } = await generateRegistrationOptions();
			if (!data) throw new Error('Could not generate registration options.');
			const registrationResponse = await startRegistration(data.passkeyGenerateRegistrationOptions);
			const { data: verifyData } = await verifyRegistrationResponse({
				variables: {
					registrationResponse,
				},
			});
			if (verifyData?.passkeyVerifyRegistrationResponse) setPasskeyAutoConnect();
		} catch (error: any) {
			if (error.name === 'InvalidStateError') {
				// This error happens when someone tries to register an already registered passkey
				console.error('Error: Authenticator was probably already registered by user');
				setPasskeyAutoConnect();
			} else {
				setError(error);
			}
		}
	}, [generateRegistrationOptions, verifyRegistrationResponse, setError]);

	if (autoConnect) return null;
	if (!autoConnect && loading) return <Spinner />;
	return (
		<Formik<Form> initialValues={{ code: '' }} onSubmit={handleOnRegister}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<div className={styles.titleContainerCenter}>Connect Passkey</div>
					<div className={styles.buttonContainerCenter}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Connect
						</Button>
					</div>
				</Form>
			)}
		</Formik>
	);
};

const AuthenticateButton = ({
	setError,
	autoConnect,
}: {
	setError: Dispatch<React.SetStateAction<Error | undefined>>;
	autoConnect: string | null;
}) => {
	const [loading, setLoading] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const [generateAuthenticationOptions] = useMutation<{
		passkeyGenerateAuthenticationOptions: PublicKeyCredentialRequestOptionsJSON;
	}>(GENERATE_AUTHENTICATION_OPTIONS);

	const [verifyAuthenticationResponse] = useMutation<{
		passkeyVerifyAuthenticationResponse: { authToken: string };
	}>(VERIFY_AUTHENTICATION_RESPONSE);

	const handleOnAuthenticate = useCallback(async () => {
		try {
			setLoading(true);
			const { data } = await generateAuthenticationOptions();
			if (!data) throw new Error('Could not generate registration options.');
			const authenticationResponse = await startAuthentication(
				data.passkeyGenerateAuthenticationOptions
			);
			const { data: verifyData } = await verifyAuthenticationResponse({
				variables: {
					authenticationResponse,
				},
			});
			const authToken = verifyData?.passkeyVerifyAuthenticationResponse.authToken;
			if (!authToken) throw new Error('Missing auth token');

			localStorage.setItem(localStorageAuthKey, authToken);

			navigate(formatRedirectUrl(redirectUri), { replace: true });
		} catch (error: any) {
			setError(error);
			setLoading(false);
		}
	}, [generateAuthenticationOptions, verifyAuthenticationResponse, setError]);

	if (!autoConnect) return null;
	if (autoConnect && loading) return <Spinner />;
	return (
		<Formik<Form> initialValues={{ code: '' }} onSubmit={handleOnAuthenticate}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<div className={styles.titleContainerCenter}>Verify Passkey</div>
					<div className={styles.buttonContainerCenter}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							verify
						</Button>
					</div>
				</Form>
			)}
		</Formik>
	);
};

export const PasskeyChallenge = () => {
	const [error, setError] = useState<Error | undefined>();
	const [autoConnect, setAutoConnect] = useState<string | null>(
		localStorage.getItem(passkeyAutoConnectFlag)
	);

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			<RegisterButton
				setError={setError}
				autoConnect={autoConnect}
				setAutoConnect={setAutoConnect}
			/>
			<AuthenticateButton setError={setError} autoConnect={autoConnect} />
			{!!error && <Alert>{error.message}</Alert>}
		</div>
	);
};
