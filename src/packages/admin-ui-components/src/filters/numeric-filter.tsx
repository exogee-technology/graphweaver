import { ChangeEvent, useEffect, useState } from 'react';
import { SelectOption } from '../select';
import { isNumeric } from '../utils';

import styles from './styles.module.css';

interface NumericFilterProps {
	fieldName: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
}

export const NumericFilter = ({ fieldName, onSelect, selected }: NumericFilterProps) => {
	const [value, setValue] = useState<number | undefined>();

	// synchronization
	useEffect(() => {
		if (!selected || !isNumeric(selected.value)) {
			setValue(undefined);
		}
		setValue(selected?.value);
	}, [selected]);

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		// option will be empty if 'clear' selected
		if (!onSelect) return;
		return onSelect(fieldName, { label: 'minAmount', value: event.target.value });
	};

	return (
		<div className={styles.numericInputWrapper}>
			<div className={styles.numericInput}>
				<input
					type={'number'}
					key={fieldName}
					placeholder={fieldName}
					value={value}
					// @todo: debounce
					onChange={onChange}
				/>
			</div>
		</div>
	);
};
