import { Field } from 'formik';

import styles from './styles.module.css';

export const PasswordComponent = () => {
	return (
		<Field
			type="password"
			placeholder="Password"
			id="password"
			name="password"
			className={styles.textInputField}
		/>
	);
};

export const ConfirmComponent = () => {
	return (
		<Field
			type="password"
			placeholder="Confirm"
			id="confirm"
			name="confirm"
			className={styles.textInputField}
		/>
	);
};

export const ResetPasswordComponent = () => {
	return (
		<>
			<label htmlFor="password" className={styles.fieldLabel}>
				password
			</label>
			<PasswordComponent />
			<label htmlFor="confirm" className={styles.fieldLabel}>
				confirm
			</label>
			<ConfirmComponent />
		</>
	);
};
