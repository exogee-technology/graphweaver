import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import { GraphweaverLogo, Alert, Button } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { RESET_PASSWORD } from './graphql';
import { ConfirmComponent, PasswordComponent } from '../password/component';

interface Form {
	password: string;
	confirm: string;
}

const authPath = import.meta.env.VITE_ADMIN_UI_AUTH_PATH ?? '/auth';
const loginPath = import.meta.env.VITE_ADMIN_UI_AUTH_LOGIN_PATH ?? '/login';

export const ResetPassword = () => {
	const [resetPassword] = useMutation<{ result: boolean }>(RESET_PASSWORD);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const token = searchParams.get('token');
	const redirectUri = searchParams.get('redirect_uri');

	const handleOnSubmit = async (values: Form, { resetForm }: FormikHelpers<Form>) => {
		setError(undefined);

		if (values.password !== values.confirm) {
			setError(new Error('Passwords do not match'));
			return;
		}

		try {
			const { data } = await resetPassword({
				variables: {
					password: values.password,
					token,
				},
			});

			const redirectUrl = redirectUri ?? new URL('/');
			navigate(`${authPath}${loginPath}?redirect_uri=${redirectUrl}`, {
				replace: true,
			});
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return (
		<Formik<Form> initialValues={{ password: '', confirm: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Please enter your new password</div>

					{!!error && <Alert>{error.message}</Alert>}

					<div className={styles.inputContainer}>
						<PasswordComponent />
						<ConfirmComponent />
					</div>

					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Submit
						</Button>
					</div>
				</Form>
			)}
		</Formik>
	);
};
