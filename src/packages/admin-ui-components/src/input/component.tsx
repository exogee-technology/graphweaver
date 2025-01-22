import clsx from 'clsx';
import { ChangeEvent } from 'react';

import styles from './styles.module.css';

interface NumericFilterProps {
	fieldName: string;
	onChange?: (fieldName: string, value?: string) => void;
	value?: string;
	inputMode:
		| 'search'
		| 'text'
		| 'email'
		| 'tel'
		| 'url'
		| 'numeric'
		| 'none'
		| 'decimal'
		| undefined;
}

export const Input = ({ fieldName, onChange, value, inputMode }: NumericFilterProps) => {
	const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (!onChange) return;
		onChange(fieldName, event.target.value);
	};

	return (
		<div className={styles.inputWrapper}>
			<div className={clsx(value && styles.inputHighlighted, styles.input)}>
				<input
					type="text"
					inputMode={inputMode}
					key={fieldName}
					placeholder={fieldName}
					value={value}
					onChange={handleOnChange}
				/>
			</div>
		</div>
	);
};
