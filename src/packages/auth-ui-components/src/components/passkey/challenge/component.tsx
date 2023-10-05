import { useCallback, useState, Dispatch } from 'react';
import { useMutation } from '@apollo/client';
import {
	Alert,
	Button,
	GraphweaverLogo,
	localStorageAuthKey,
	Spinner,
} from '@exogee/graphweaver-admin-ui-components';
import { startRegistration } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types';
import { Form, Formik } from 'formik';

import { GENERATE_REGISTRATION_OPTIONS, VERIFY_REGISTRATION_OPTIONS } from './graphql';
import styles from './styles.module.css';

const passkeyAutoConnectFlag = 'passkey:autoConnectTag';

interface Form {
	code: string;
}

const RegisterButton = ({
	setError,
}: {
	setError: Dispatch<React.SetStateAction<Error | undefined>>;
}) => {
	const autoConnect = localStorage.getItem(passkeyAutoConnectFlag);

	// This checks if we can register a wallet and redirects if we cant
	const [generateRegistrationOptions, { loading: generateLoading }] = useMutation<{
		passkeyGenerateRegistrationOptions: PublicKeyCredentialCreationOptionsJSON;
	}>(GENERATE_REGISTRATION_OPTIONS);

	const [verifyRegistrationOptions, { loading: verifyLoading }] = useMutation<{
		passkeyVerifyRegistrationResponse: boolean;
	}>(VERIFY_REGISTRATION_OPTIONS);

	const loading = generateLoading || verifyLoading;

	const handleOnRegister = useCallback(async () => {
		try {
			const { data } = await generateRegistrationOptions();
			if (!data) throw new Error('Could not generate registration options.');
			const registrationResponse = await startRegistration(data.passkeyGenerateRegistrationOptions);
			const { data: verifyData } = await verifyRegistrationOptions({
				variables: {
					registrationResponse,
				},
			});
			if (verifyData?.passkeyVerifyRegistrationResponse) {
				localStorage.setItem(passkeyAutoConnectFlag, 'true');
			}
		} catch (error: any) {
			if (error.name === 'InvalidStateError') {
				// This error happens when someone tries to register an already registered passkey
				console.error('Error: Authenticator was probably already registered by user');
				localStorage.setItem(passkeyAutoConnectFlag, 'true');
			} else {
				setError(error);
			}
		}
	}, [generateRegistrationOptions, verifyRegistrationOptions, setError]);

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

export const PasskeyChallenge = () => {
	const [error, setError] = useState<Error | undefined>();

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			<RegisterButton setError={setError} />
			{!!error && <Alert>{error.message}</Alert>}
		</div>
	);
};
