import { useState } from 'react';
import { DateTime } from 'luxon';

import { SelectOption } from '../';
import { DatePicker } from '../date-picker';

import styles from './styles.module.css';

interface DateRangeFilterProps {
	fieldName: string;
	onSelect?: (fieldName: string, start?: SelectOption, end?: SelectOption) => void;
	selectedStart?: SelectOption;
	selectedEnd?: SelectOption;
}

export const DateRangeFilter = ({
	fieldName,
	onSelect,
	selectedStart,
	selectedEnd,
}: DateRangeFilterProps) => {
	const [show, setShow] = useState(false);
	const [buttonText, setButtonText] = useState(fieldName);
	const [selectedDateRange, setSelectedDateRange] = useState<{
		startDate?: DateTime;
		endDate?: DateTime;
	}>({
		startDate: undefined,
		endDate: DateTime.now(),
	});

	const onChange = (startDate?: DateTime, endDate?: DateTime) => {
		setSelectedDateRange({
			startDate,
			endDate,
		});
	};

	//@todo: NB dates are UTC but the filter is local
	return <DatePicker onChange={onChange} placeholder={fieldName} isRangePicker />;
};
