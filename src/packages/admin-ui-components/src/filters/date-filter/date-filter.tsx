import React, { useEffect, useState } from 'react';
import { SelectOption } from '../../select';

import styles from './styles.module.css';
import './styles.module.css';

// TODO: There's no way to insert a placeholder, without coding an overlay or something
// TODO: Also clearing this from outside the control does not update the internal state,
// but need to avoid useEffect loops
export const DateFilter = React.forwardRef(
	(
		{
			fieldName,
			entity,
			onSelect,
			selected,
		}: {
			fieldName: string;
			entity: string;
			onSelect?: (fieldName: string, option?: SelectOption) => void;
			selected?: SelectOption;
		},
		ref: any
	) => {
		const [date, setDate] = useState<string>(selected?.value ?? '');

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			e.preventDefault();
			setDate(e.target.value);
		};

		useEffect(() => {
			if (!onSelect) return;
			if (date === null || date.length === 0) {
				return onSelect(fieldName, undefined);
			}
			return onSelect(fieldName, { label: 'selectedDate', value: date });
		}, [date]);

		return (
			<div>
				<input
					className={styles.datePickerWrapper}
					value={date}
					type="date"
					onChange={handleChange}
					ref={ref}
				/>
			</div>
		);
	}
);
