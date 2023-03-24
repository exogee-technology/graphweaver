import { DateTime } from 'luxon';

import { Filter } from '../';
import { DatePicker } from '../date-picker';

import styles from './styles.module.css';

interface DateRangeFilterProps {
	fieldName: string;
	entity?: string; // Not used but added to conform to API
	onChange?: (fieldName: string, filter?: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const DateRangeFilter = ({
	fieldName,
	onChange,
	initialFilter,
	resetCount,
}: DateRangeFilterProps) => {
	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		onChange?.(
			fieldName,
			startDate && endDate
				? {
						_and: [
							{ [`${fieldName}_gte`]: startDate.startOf('day').toISO() },
							{ [`${fieldName}_lte`]: endDate.endOf('day').toISO() },
						],
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
