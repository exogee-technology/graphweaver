import { DateTime } from 'luxon';

import { Filter } from '../';
import { DatePicker } from '../date-picker';

export type DateRangeFilterType = { [x: string]: string } | undefined;

export interface DateRangeFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (entityName: string, newFilter: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

const getInitialDateWithKeyFromFilter = (key: string, filter?: Filter) => {
	const iSOString = filter?.[key] as string | undefined;
	return iSOString ? DateTime.fromISO(iSOString) : undefined;
};

export const DateRangeFilter = ({
	fieldName,
	onChange,
	initialFilter,
	resetCount,
}: DateRangeFilterProps) => {
	const startKey = `${fieldName}_gte`;
	const endKey = `${fieldName}_lte`;
	const initialStartDate = getInitialDateWithKeyFromFilter(startKey, initialFilter);
	const initialEndDate = getInitialDateWithKeyFromFilter(endKey, initialFilter);

	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		onChange?.(fieldName, {
			...(startDate ? { [startKey]: startDate.toISO() } : {}),
			...(endDate ? { [endKey]: endDate.toISO() } : {}),
		});
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
