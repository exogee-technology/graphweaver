import { Field } from 'formik';
import { useEffect, useRef } from 'react';

import styles from '../styles.module.css';
import { autoFocusDelay } from '../../config';

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
	const textRef = useRef<HTMLInputElement>();

	// We cant use the autoFocus prop directly on the input field because it will break the animation
	useEffect(() => {
		if (autoFocus) {
			setTimeout(() => {
				textRef.current?.focus();
			}, autoFocusDelay);
		}
	}, []);
	return (
		<Field
			id={name}
			innerRef={textRef}
			name={name}
			type={type}
			className={styles.textInputField}
			disabled={disabled}
		/>
	);
};
