import { Field, FieldAttributes } from 'formik';

import styles from './styles.module.css';

export const PasswordFieldComponent = (props: FieldAttributes<any>) => {
	return (
		<Field
			// These can be overridden
			className={styles.textInputField}
			placeholder="Password"
			{...props}
			// But we really want these to not be overridden
			type="password"
			id="password"
			name="password"
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

export const PasswordComponent = (props: FieldAttributes<any>) => {
	return (
		<>
			<label htmlFor="password" className={styles.fieldLabel}>
				password
			</label>
			<PasswordFieldComponent {...props} />
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
