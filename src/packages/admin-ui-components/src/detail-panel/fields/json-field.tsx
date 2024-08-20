import clsx from 'clsx';
import { useField } from 'formik';

import { useAutoFocus } from '../../hooks';
import styles from '../styles.module.css';

export const JSONField = ({
	name,
	autoFocus,
	disabled,
}: {
	name: string;
	autoFocus: boolean;
	disabled?: boolean;
}) => {
	const [field, meta] = useField({ name, multiple: false });
	const inputRef = useAutoFocus<HTMLTextAreaElement>(autoFocus);

	if (disabled) {
		return (
			<code ref={inputRef} tabIndex={0}>
				{JSON.stringify(meta.value, null, 4)}
			</code>
		);
	}

	return (
		<textarea
			{...field}
			id={name}
			ref={inputRef}
			rows={6}
			className={clsx(styles.textInputField, styles.textArea)}
		/>
	);
};
