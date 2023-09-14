import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import { GraphweaverLogo, Alert, Button } from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { CHALLENGE_MUTATION } from './graphql';

interface Form {
	password: string;
}

export const Challenge = () => {
	const navigate = useNavigate();
	const [challengePassword] = useMutation<{ challengePassword: { authToken: string } }>(
		CHALLENGE_MUTATION
	);
	const [error, setError] = useState<Error | undefined>();

	const handleOnSubmit = async (
		values: Form,
		{ setSubmitting, resetForm }: FormikHelpers<Form>
	) => {
		let token;
		setError(undefined);

		try {
			const { data } = await challengePassword({
				variables: {
					password: values.password,
				},
			});

			token = data?.challengePassword.authToken;
			if (!token) throw new Error('Missing token');

			localStorage.setItem('graphweaver-auth', token);
			navigate('/');
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Formik<Form> initialValues={{ password: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Confirm your Password</div>
					<Field
						type="password"
						placeholder="Password"
						id="password"
						name="password"
						className={styles.textInputField}
					/>
					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Confirm
						</Button>
					</div>
					{!!error && <Alert>{error.message}</Alert>}
				</Form>
			)}
		</Formik>
	);
};
