import React, { useEffect, useState } from 'react';
import { Filter } from '..';

import styles from './styles.module.css';
import './styles.module.css';

export const DateFilter = React.forwardRef(
	(
		{
			fieldName,
			entity,
			onSelect,
		}: {
			fieldName: string;
			entity: string;
			onSelect?: (fieldName: string, filter?: Filter) => void;
		},
		ref: any
	) => {
		const [date, setDate] = useState<string | null>(null);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			e.preventDefault();
			console.log('DEBUG: handle triggered (for testing clearFilters');
			setDate(e.target.value);
		};

		useEffect(() => {
			// @todo: control, eg. when 'clear' selected
			// @todo: multiple filters
			if (!onSelect) return;
			if (date === null || date.length === 0) {
				return onSelect(fieldName, undefined);
			}
			return onSelect(fieldName, {
				filter: { kind: 'equals', field: fieldName, value: date },
			});
		}, [date]);

		return (
			<div>
				<input
					className={styles.datePickerWrapper}
					defaultValue={fieldName}
					type="date"
					onChange={handleChange}
					ref={ref}
				/>
			</div>
		);
	}
);
