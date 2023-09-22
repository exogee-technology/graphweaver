import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useMutation } from '@apollo/client';
import {
	GraphweaverLogo,
	Alert,
	Button,
	REDIRECT_HEADER,
} from '@exogee/graphweaver-admin-ui-components';

import styles from './styles.module.css';

import { SEND_MAGIC_LINK_MUTATION } from './graphql';

interface Form {
	username: string;
}

export const MagicLinkSend = () => {
	const [sendMagicLink] = useMutation<{ result: boolean }>(SEND_MAGIC_LINK_MUTATION);
	const [error, setError] = useState<Error | undefined>();
	const [sent, setSent] = useState(false);
	const [searchParams] = useSearchParams();

	const redirectUri = searchParams.get('redirect_uri');
	if (!redirectUri) throw new Error('Missing redirect URL');

	const handleOnSubmit = async (
		values: Form,
		{ setSubmitting, resetForm }: FormikHelpers<Form>
	) => {
		setError(undefined);

		try {
			await sendMagicLink({
				variables: {
					username: values.username,
				},
				context: {
					headers: {
						[REDIRECT_HEADER]: redirectUri,
					},
				},
			});

			setSent(true);
		} catch (error) {
			resetForm();
			setError(error instanceof Error ? error : new Error(String(error)));
			setSubmitting(false);
		}
	};

	return (
		<Formik<Form> initialValues={{ username: '' }} onSubmit={handleOnSubmit}>
			{({ isSubmitting }) => (
				<Form className={styles.wrapper}>
					<GraphweaverLogo width="52" className={styles.logo} />
					{sent ? (
						<p className={styles.sent}>
							We&#39;ve sent an email to you that contains a link, click to sign in.
						</p>
					) : (
						<>
							<div className={styles.titleContainer}>Enter your Username</div>
							<p>Enter your username below and we&#39;ll send you a magic link to login.</p>
							<Field
								type="text"
								placeholder="Username"
								id="username"
								name="username"
								className={styles.textInputField}
							/>
							<div className={styles.buttonContainer}>
								<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
									Send
								</Button>
							</div>
						</>
					)}

					{!!error && <Alert>{error.message}</Alert>}
				</Form>
			)}
		</Formik>
	);
};
