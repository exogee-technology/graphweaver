import { Field } from 'formik';

import styles from './styles.module.css';

export const PasswordFieldComponent = () => {
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

export const ConfirmFieldComponent = () => {
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

export const PasswordComponent = () => {
	return (
		<>
			<label htmlFor="password" className={styles.fieldLabel}>
				password
			</label>
			<PasswordFieldComponent />
		</>
	);
};

export const ConfirmComponent = () => {
	return (
		<>
			<label htmlFor="confirm" className={styles.fieldLabel}>
				confirm
			</label>
			<ConfirmFieldComponent />
		</>
	);
};
