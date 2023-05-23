import { Field, Form, Formik, FormikHelpers } from 'formik';
import { GraphweaverLogo } from '../assets';
import { Button } from '../button';
import { Input } from '../input';

import styles from './styles.module.css';
import { useMutation } from '@apollo/client';

import { LOGIN_MUTATION } from './graphql';

export const Login = () => {
	const [login] = useMutation(LOGIN_MUTATION);

	const handleOnSubmit = async (values: any, actions: FormikHelpers<any>) => {
		console.log(values);
		await login({
			variables: {
				username: values.username,
				password: values.password,
			},
		});

		actions.setSubmitting(false);
	};

	return (
		<Formik initialValues={{ username: '', password: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Login</div>
					<Field
						placeholder={'username'}
						id={'username'}
						name={'username'}
						className={styles.textInputField}
					/>
					<Field
						type={'password'}
						placeholder={'password'}
						id={'password'}
						name={'password'}
						className={styles.textInputField}
					/>
					<div className={styles.buttonContainer}>
						<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
							Login
						</Button>
					</div>
				</Form>
			)}
		</Formik>
	);
};
