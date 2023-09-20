import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import { GraphweaverLogo, Alert, Button } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { LOGIN_MUTATION } from './graphql';

interface Form {
	username: string;
	password: string;
}

export const Login = () => {
	const [login] = useMutation<{ result: { authToken: string } }>(LOGIN_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleOnSubmit = async (
		values: Form,
		{ setSubmitting, resetForm }: FormikHelpers<Form>
	) => {
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
			window.location.replace(redirectUri);
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Formik<Form> initialValues={{ username: '', password: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Login</div>
					<Field
						placeholder="Username"
						id="username"
						name="username"
						className={styles.textInputField}
					/>
					<Field
						type="password"
						placeholder="Password"
						id="password"
						name="password"
						className={styles.textInputField}
					/>
					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Login
						</Button>
					</div>
					{!!error && <Alert>{error.message}</Alert>}
				</Form>
			)}
		</Formik>
	);
};
