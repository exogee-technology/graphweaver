import { useState } from 'react';
import { DateTime } from 'luxon';

import { Filter, SelectOption } from '../';
import { DatePicker } from '../date-picker';

import styles from './styles.module.css';

interface DateRangeFilterProps {
	fieldName: string;
	entity?: string; // Not used but added to conform to API
	onChange?: (fieldName: string, filter?: Filter) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const DateRangeFilter = ({
	fieldName,
	onChange,
	selected,
	resetCount,
}: DateRangeFilterProps) => {
	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		onChange?.(
			fieldName,
			startDate && endDate
				? {
						[fieldName]: {
							_and: [
								{ [`${fieldName}_gte`]: startDate.toISODate() },
								{ [`${fieldName}_lte`]: endDate.toISODate() },
							],
						},
				  }
				: undefined
		);
	};

	//@todo: NB dates are UTC but the filter is local
	return (
		<DatePicker
			key={`${fieldName}:${resetCount}`}
			onChange={handleOnChange}
			placeholder={fieldName}
			isRangePicker
		/>
	);
};
