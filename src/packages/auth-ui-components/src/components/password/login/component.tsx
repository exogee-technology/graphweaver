import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	Button,
	localStorageAuthKey,
} from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { LOGIN_MUTATION } from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';
import { PasswordFieldComponent } from '../password';

interface Form {
	username: string;
	password: string;
}

export const PasswordLogin = ({ canResetPassword = true }: { canResetPassword?: boolean }) => {
	const [login] = useMutation<{ result: { authToken: string } }>(LOGIN_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleOnSubmit = async (values: Form, { resetForm }: FormikHelpers<Form>) => {
		let token;
		setError(undefined);

		try {
			const { data } = await login({
				variables: {
					username: values.username,
					password: values.password,
				},
			});

			token = data?.result.authToken;
			if (!token) throw new Error('Missing token');

			localStorage.setItem(localStorageAuthKey, token);
			navigate(formatRedirectUrl(redirectUri), { replace: true });
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return (
		<>
			<Formik<Form> initialValues={{ username: '', password: '' }} onSubmit={handleOnSubmit}>
				{({ isSubmitting }) => (
					// @ts-expect-error - Formik typing issue https://github.com/jaredpalmer/formik/issues/2120#issuecomment-566515114
					<Form className={styles.wrapper}>
						<GraphweaverLogo width="52" className={styles.logo} />
						<div className={styles.titleContainer}>Login</div>
						<Field
							placeholder="Username"
							id="username"
							name="username"
							className={styles.textInputField}
						/>
						<PasswordFieldComponent />
						<div className={styles.buttonContainer}>
							<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
								Login
							</Button>
						</div>
						{!!error && <Alert>{error.message}</Alert>}
					</Form>
				)}
			</Formik>
			{canResetPassword && <Link to="../forgot-password">Forgot Password?</Link>}
		</>
	);
};
