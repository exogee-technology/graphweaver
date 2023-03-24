import { DateTime } from 'luxon';

import { Filter } from '../';
import { DatePicker } from '../date-picker';

export type DateRangeFilterType = { [x: string]: string }[] | undefined;

export interface DateRangeFilterProps {
	fieldName: string;
	entity?: string; // Not used but added to conform to API
	onChange?: (fieldName: string, filter?: Filter<DateRangeFilterType>) => void;
	initialFilter?: Filter<DateRangeFilterType>;
	resetCount: number; // We use this to reset the filter using the key
}

const getInitialDateWithKeyFromFilter = (key: string, filter?: Filter<DateRangeFilterType>) => {
	const iSOString = filter?._and?.find((_filter) => _filter[key])?.[key];
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
		onChange?.(
			fieldName,
			startDate && endDate
				? {
						_and: [
							{ [startKey]: startDate.startOf('day').toISO() },
							{ [endKey]: endDate.endOf('day').toISO() },
						],
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
