import { DateTime } from 'luxon';

import { Filter } from '../';
import { DatePicker } from '../date-picker';

export type DateRangeFilterType = { [x: string]: string } | undefined;

export interface DateRangeFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

const getFilterDateTime = (key: string, filter?: Filter) => {
	const isoString = filter?.[key] as string | undefined;
	return isoString ? DateTime.fromISO(isoString) : undefined;
};

export const DateRangeFilter = ({ fieldName, onChange, filter }: DateRangeFilterProps) => {
	const startKey = `${fieldName}_gte`;
	const endKey = `${fieldName}_lte`;
	const startDate = getFilterDateTime(startKey, filter);
	const endDate = getFilterDateTime(endKey, filter);

	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		onChange?.(
			fieldName,
			startDate && endDate ? { [startKey]: startDate.toISO(), [endKey]: endDate.toISO() } : {}
		);
	};

	return (
		<DatePicker
			key={fieldName}
			onChange={handleOnChange}
			placeholder={fieldName}
			isRangePicker
			startDate={startDate}
			endDate={endDate}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
