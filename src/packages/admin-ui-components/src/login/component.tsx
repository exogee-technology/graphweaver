import { Field, Form, Formik, FormikHelpers } from 'formik';
import { GraphweaverLogo } from '../assets';
import { Button } from '../button';
import { Input } from '../input';

import styles from './styles.module.css';
import { useMutation } from '@apollo/client';

import { LOGIN_MUTATION } from './graphql';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
	const navigate = useNavigate();
	const [login] = useMutation<{ login: { authToken: string } }>(LOGIN_MUTATION);

	const handleOnSubmit = async (values: any, actions: FormikHelpers<any>) => {
		const res = await login({
			variables: {
				username: values.username,
				password: values.password,
			},
		});

		actions.setSubmitting(false);

		if (res?.data?.login.authToken) {
			localStorage.setItem('graphweaver-auth', res.data.login.authToken);
			navigate('/');
		}
	};

	return (
		<Formik initialValues={{ username: '', password: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					<div className={styles.titleContainer}>Login</div>
					<Field
						placeholder={'Username'}
						id={'username'}
						name={'username'}
						className={styles.textInputField}
					/>
					<Field
						type={'password'}
						placeholder={'Password'}
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
