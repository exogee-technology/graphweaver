import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	REDIRECT_HEADER,
	localStorageAuthKey,
	Button,
} from '@exogee/graphweaver-admin-ui-components';
import { Field, Form, Formik, FormikHelpers } from 'formik';

import styles from './styles.module.css';

import { SEND_OTP_MUTATION, VERIFY_OTP_MUTATION } from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';

interface Form {
	code: string;
}

export const OTPChallenge = () => {
	const [sendOTP] = useMutation<{ result: boolean }>(SEND_OTP_MUTATION);
	const [verifyOTP] = useMutation<{ result: { authToken: string } }>(VERIFY_OTP_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [sent, setSent] = useState<boolean>(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleSendCode = useCallback(async () => {
		try {
			await sendOTP({
				context: {
					headers: {
						[REDIRECT_HEADER]: redirectUri,
					},
				},
			});
			setError(undefined);
			setSent(true);
		} catch (error) {
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	}, [sendOTP, setError, setSent]);

	const handleVerifyCode = useCallback(
		async ({ code }: Form, { resetForm }: FormikHelpers<Form>) => {
			try {
				const { data } = await verifyOTP({
					variables: {
						code,
					},
				});

				const authToken = data?.result.authToken;
				if (!authToken) throw new Error('Missing auth token');

				localStorage.setItem(localStorageAuthKey, authToken);
				navigate(formatRedirectUrl(redirectUri), {
					replace: true,
				});
			} catch (error) {
				resetForm();
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		},
		[verifyOTP]
	);

	return (
		<div className={styles.wrapper}>
			<div>
				<GraphweaverLogo width="52" className={styles.logo} />
			</div>
			{sent && !error ? (
				<Formik<Form> initialValues={{ code: '' }} onSubmit={handleVerifyCode}>
					{({ isSubmitting }) => (
						<Form className={styles.wrapper}>
							<div className={styles.titleContainer}>Confirm Code</div>
							<Field
								type="code"
								placeholder="Code"
								id="code"
								name="code"
								className={styles.textInputField}
							/>
							<div className={styles.buttonContainer}>
								<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
									Confirm
								</Button>
							</div>
						</Form>
					)}
				</Formik>
			) : (
				<Formik<Form> initialValues={{ code: '' }} onSubmit={handleSendCode}>
					{({ isSubmitting }) => (
						<Form className={styles.wrapper}>
							<div className={styles.titleContainerCenter}>Send OTP Code</div>
							<div className={styles.buttonContainerCenter}>
								<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
									Send
								</Button>
							</div>
							{!!error && <Alert>{error.message}</Alert>}
						</Form>
					)}
				</Formik>
			)}
		</div>
	);
};
