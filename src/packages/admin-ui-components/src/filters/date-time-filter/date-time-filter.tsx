import React from 'react';
import Datetime from 'react-datetime';
import moment, { Moment } from 'moment';
import { ExitIcon } from '../../assets';
import { SelectOption } from '../../';

import styles from './styles.module.css';
import './styles.module.css';

import 'react-datetime/css/react-datetime.css';
import classnames from 'classnames';

export const DateFilter = ({
	fieldName,
	onSelect,
	selected,
}: {
	fieldName: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
}) => {
	const handleChange = (date: Moment | string) => {
		if (!onSelect) return;
		return onSelect(fieldName, { label: 'selectedDate', value: dateStr(date) });
	};

	const dateStr = (date: Moment | string): string =>
		typeof date === 'string' ? date : moment(date).format('YYYY-MM-DD');

	const parseDate = (selected?: SelectOption): string =>
		selected?.value ? dateStr(selected.value as Moment | string) : '';

	const clear = () => onSelect?.(fieldName, undefined);

	return (
		<div className={styles.datePickerWrapper}>
			<div className={styles.indicatorWrapper}>
				<span className={styles.indicatorSeparator}></span>
				<div className={styles.indicatorContainer}>
					<ExitIcon className={styles.closeIcon} onClick={clear} />
				</div>
			</div>
			{/* </Button> */}
			<Datetime
				// ref={ref}
				value={parseDate(selected)}
				// initialValue={date}
				// @todo: debounce (set to 'date'?)/invoke time component
				// updateOnView={'time'}
				dateFormat={'YYYY-MM-DD'}
				// @todo: true=locale, false=disabled (datepicker only)
				timeFormat={false}
				input={true}
				// Turn this off after testing complete; see ID-2934 AC (3)
				utc={true}
				// Receives moment object (valid) or string (invalid)
				onChange={handleChange}
				inputProps={{
					placeholder: fieldName,
					className: classnames(
						parseDate(selected) !== '' && styles.inputFieldActive,
						styles.inputField
					),
					value: parseDate(selected),
				}}
				// Close once the day has been selected
				closeOnSelect={true}
			/>
		</div>
	);
};
