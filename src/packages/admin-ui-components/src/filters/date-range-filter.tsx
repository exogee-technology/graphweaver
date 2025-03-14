import { DateTime } from 'luxon';
import { AdminUIFilterType, dateTimeFieldTypes, Filter } from '../';
import { DatePicker } from '../date-picker';

export type DateRangeFilterType = { [x: string]: string } | undefined;

export interface DateRangeFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
	filterType: AdminUIFilterType.DATE_TIME_RANGE | AdminUIFilterType.DATE_RANGE;
	fieldType: string;
}

const getFilterDateTime = (key: string, filter?: Filter) => {
	const isoString = filter?.[key] as string | undefined;
	return isoString ? DateTime.fromISO(isoString) : undefined;
};

export const DateRangeFilter = ({
	fieldName,
	onChange,
	filter,
	filterType,
	fieldType,
}: DateRangeFilterProps) => {
	const startKey = `${fieldName}_gte`;
	const endKey = `${fieldName}_lte`;
	const startDate = getFilterDateTime(startKey, filter);
	const endDate = getFilterDateTime(endKey, filter);

	const handleOnChange = (startDate?: DateTime, endDate?: DateTime) => {
		// Note: There is an option to render filter as DATE_RANGE but still have a fieldType that has time. In this case the system should not show the time but handle it behind the scenes.
		const isDateWithTime =
			filterType === AdminUIFilterType.DATE_TIME_RANGE || dateTimeFieldTypes.has(fieldType);
		onChange?.(
			fieldName,
			startDate && endDate
				? {
						[startKey]: isDateWithTime ? startDate.toISO() : startDate.toISODate(),
						[endKey]: isDateWithTime ? endDate.toISO() : endDate.toISODate(),
					}
				: {}
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
			filterType={filterType}
			fieldType={fieldType}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
