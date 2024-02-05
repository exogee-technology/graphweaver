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

import { RESET_PASSWORD } from './graphql';
import { formatRedirectUrl } from '../../../utils/urls';

interface Form {
	password: string;
	confirmPassword: string;
}

export const ResetPassword = () => {
	const [resetPassword] = useMutation<{ result: boolean }>(RESET_PASSWORD);
	const [error, setError] = useState<Error | undefined>();
	const [hasSent, setHasSent] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const handleOnSubmit = async (values: Form, { resetForm }: FormikHelpers<Form>) => {
		let token;
		setError(undefined);

		if (values.password !== values.confirmPassword) {
			setError(new Error('Passwords do not match'));
			return;
		}

		try {
			const { data } = await resetPassword({
				variables: {
					password: values.password,
				},
			});

			console.log('data', data);
			if (data?.result === true) {
				setHasSent(true);
			} else {
				throw new Error('Failed to send forgotten password link');
			}
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	return hasSent ? (
		<div className={styles.wrapper}>
			<div className={styles.titleContainer}>Success! A password reset link has been sent.</div>
		</div>
	) : (
		<Formik<Form> initialValues={{ password: '', confirmPassword: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>
						Please enter your user name to get a forgotten password link.
					</div>
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
