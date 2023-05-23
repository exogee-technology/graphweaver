import { ChangeEvent, useEffect, useState } from 'react';
import classNames from 'classnames';

import { SelectOption } from '../';
import { useDebounce } from '../hooks';

import styles from './styles.module.css';

interface NumericFilterProps {
	fieldName: string;
	onChange?: (fieldName: string, value?: string) => void;
	value?: string;
	type?: 'text' | 'password';
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

export const Input = ({
	fieldName,
	onChange,
	value: initialValue,
	inputMode,
	type = 'text',
}: NumericFilterProps) => {
	const [value, setValue] = useState<string | undefined>(initialValue ?? '');
	const debouncedValue = useDebounce<string | undefined>(value, 800); // debounce request for 800ms

	const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		setValue(event.target.value);
	};

	useEffect(() => {
		if (!onChange) return;
		onChange(fieldName, debouncedValue);
	}, [debouncedValue]);

	return (
		<div className={styles.inputWrapper}>
			<div className={classNames(value && styles.inputHighlighted, styles.input)}>
				<input
					type={type}
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
