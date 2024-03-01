import { DateTime } from 'luxon';

import { Filter } from '../';
import { DatePicker } from '../date-picker';

export type DateRangeFilterType = { [x: string]: string } | undefined;

export interface DateRangeFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (key: string, newFilter?: Filter) => void;
	initialValue?: DateRangeFilterType;
	resetCount: number; // We use this to reset the filter using the key
}

const getInitialDateWithKeyFromFilter = (key: string, filter?: DateRangeFilterType) => {
	const iSOString = filter?.[key];
	return iSOString ? DateTime.fromISO(iSOString) : undefined;
};

export const DateRangeFilter = ({
	fieldName,
	onChange,
	initialValue,
	resetCount,
}: DateRangeFilterProps) => {
	const startKey = `${fieldName}_gte`;
	const endKey = `${fieldName}_lte`;
	const initialStartDate = getInitialDateWithKeyFromFilter(startKey, initialValue);
	const initialEndDate = getInitialDateWithKeyFromFilter(endKey, initialValue);

	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		onChange?.(
			fieldName,
			startDate && endDate
				? {
						[startKey]: startDate.startOf('day').toISO(),
						[endKey]: endDate.endOf('day').toISO(),
				  }
				: undefined
		);
	};

	return (
		<DatePicker
			key={`${fieldName}:${resetCount}`}
			onChange={handleOnChange}
			placeholder={fieldName}
			isRangePicker
			initialStartDate={initialStartDate}
			initialEndDate={initialEndDate}
		/>
	);
};
