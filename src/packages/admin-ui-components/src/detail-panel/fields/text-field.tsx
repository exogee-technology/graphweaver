import { Field } from 'formik';

import { useAutoFocus } from '../../hooks';

import styles from '../styles.module.css';

export const TextField = ({
	name,
	autoFocus,
	disabled = false,
	type,
}: {
	name: string;
	autoFocus: boolean;
	disabled?: boolean;
	type: 'number' | 'text';
}) => {
	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);
	return (
		<Field
			id={name}
			innerRef={inputRef}
			name={name}
			type={type}
			className={styles.textInputField}
			disabled={disabled}
		/>
	);
};
