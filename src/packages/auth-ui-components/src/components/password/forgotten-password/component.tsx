import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	Button,
	localStorageAuthKey,
} from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { SEND_FORGOTTEN_PASSWORD_LINK } from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';

interface Form {
	username: string;
	password: string;
}

export const ForgottenPassword = () => {
	const [sendForgottenPasswordLink] = useMutation<{ result: { authToken: string } }>(
		SEND_FORGOTTEN_PASSWORD_LINK
	);
	const [error, setError] = useState<Error | undefined>();
	const [hasSent, setHasSent] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	// const redirectUri = searchParams.get('redirect_uri');
	// if (!redirectUri) throw new Error('Missing redirect URL');

	const handleOnSubmit = async (values: Form, { resetForm }: FormikHelpers<Form>) => {
		let token;
		setError(undefined);

		try {
			const { data } = await sendForgottenPasswordLink({
				variables: {
					username: values.username,
				},
			});

			console.log('data', data);
			// token = data?.result.authToken;
			// if (!token) throw new Error('Missing token');

			// localStorage.setItem(localStorageAuthKey, token);
			// Display success message
			setHasSent(true);
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return (
		<Formik<Form> initialValues={{ username: '', password: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>
						Please enter your user name to get a forgotten password link.
					</div>
					<Field
						placeholder="Username"
						id="username"
						name="username"
						className={styles.textInputField}
					/>

					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Send Forgotten Password Link
						</Button>
					</div>
					{!!error && <Alert>{error.message}</Alert>}
				</Form>
			)}
		</Formik>
	);
};
