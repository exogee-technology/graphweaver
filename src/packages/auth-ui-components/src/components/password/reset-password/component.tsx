import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import { GraphweaverLogo, Alert, Button } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { RESET_PASSWORD } from './graphql';

interface Form {
	password: string;
	confirmPassword: string;
}

export const ResetPassword = () => {
	const [resetPassword] = useMutation<{ result: boolean }>(RESET_PASSWORD);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const token = searchParams.get('token');
	const redirectUri = searchParams.get('redirect_uri');

	const handleOnSubmit = async (values: Form, { resetForm }: FormikHelpers<Form>) => {
		setError(undefined);

		if (values.password !== values.confirmPassword) {
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

			// @todo - it would be better to get the redirect URL from the flow from the login page -> forgot password -> reset password -> reset password success
			const redirectUrl = redirectUri ?? new URL('/');
			navigate(`/auth/login?redirect_uri=${redirectUrl}`, { replace: true });
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return (
		<Formik<Form> initialValues={{ password: '', confirmPassword: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Please enter your new password</div>
					<Field
						placeholder="Password"
						id="password"
						name="password"
						className={styles.textInputField}
					/>

					<Field
						placeholder="Confirm Password"
						id="confirm-password"
						name="confirmPassword"
						className={styles.textInputField}
					/>

					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Submit
						</Button>
					</div>
					{!!error && <Alert>{error.message}</Alert>}
				</Form>
			)}
		</Formik>
	);
};
