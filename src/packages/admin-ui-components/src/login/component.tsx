import { Field, Form, Formik, FormikHelpers } from 'formik';
import { GraphweaverLogo } from '../assets';
import { Button } from '../button';

import styles from './styles.module.css';
import { useMutation } from '@apollo/client';

import { LOGIN_MUTATION } from './graphql';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface Form {
	username: string;
	password: string;
}

export interface LoginProps {
	onLogin?(username: string, password: string): string | Promise<string>; // Returns a token to place in Authorization header
}

export const Login = ({ onLogin }: LoginProps) => {
	const navigate = useNavigate();
	const [login] = useMutation<{ login: { authToken: string } }>(LOGIN_MUTATION);
	const [error, setError] = useState<Error | undefined>();

	const handleOnSubmit = async (values: Form, { setSubmitting }: FormikHelpers<Form>) => {
		let token;

		try {
			if (onLogin) {
				token = await onLogin(values.username, values.password);
			} else {
				const { data } = await login({
					variables: {
						username: values.username,
						password: values.password,
					},
				});

				token = data?.login.authToken;
				if (!token) throw new Error('Missing token');

				localStorage.setItem('graphweaver-auth', token);
				navigate('/');
			}
		} catch (error) {
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
					{!!error && (
						<div>
							<b>Error: ${error.message}</b>
						</div>
					)}
				</Form>
			)}
		</Formik>
	);
};
