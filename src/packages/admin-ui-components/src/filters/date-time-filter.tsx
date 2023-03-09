import React, { useEffect, useImperativeHandle, useState } from 'react';
import Datetime from 'react-datetime';
// import moment from 'moment';
import { SelectOption } from '..';

import styles from './styles.module.css';
import './styles.module.css';

import 'react-datetime/css/react-datetime.css';

export const DateFilter = React.forwardRef(
	(
		{
			fieldName,
			entity,
			onSelect,
			selected,
		}: {
			fieldName: string;
			entity: string;
			onSelect?: (fieldName: string, option?: SelectOption) => void;
			selected?: SelectOption;
		},
		ref: any
	) => {
		const [date, setDate] = useState<string>(selected?.value ?? '');

		useEffect(() => {
			if (!onSelect) return;
			if (date === null || date?.length === 0) {
				return onSelect(fieldName, { label: 'selectedDate', value: '' });
			}
			return onSelect(fieldName, { label: 'selectedDate', value: date });
		}, [date]);

		const handleChange = (moment: any) => {
			setDate(moment as string);
		};

		const onClear = () => {
			setDate('');
		};
		useImperativeHandle(ref, () => {
			return {
				onClear,
			};
		});

		// const renderInput = (
		// 	props: React.HTMLProps<HTMLInputElement>,
		// 	openCalendar: Function,
		// 	closeCalendar: Function
		// ) => {
		// 	// function clear() {
		// 	// 	props.onChange && props.onChange({target: {value: '' }});
		// 	// }
		// 	return (
		// 		<div>
		// 			<input {...props} />
		// 			{/* <button onClick={openCalendar}>open calendar</button>
		// 			<button onClick={closeCalendar}>close calendar</button> */}
		// 			<button onClick={onClear}>clear</button>
		// 		</div>
		// 	);
		// };

		return (
			<div>
				<Datetime
					// ref={ref}
					value={date}
					// initialValue={date}
					// @todo: debounce (set to 'date'?)/invoke time component
					// updateOnView={'time'}
					dateFormat={'YYYY-MM-DD'}
					// @todo: true=locale, false=disabled (datepicker only)
					timeFormat={false}
					input={true}
					// This has to be set TRUE if the dates being displayed are UTC, otherwise the
					// filter makes no sense
					utc={true}
					className={styles.datePickerWrapper}
					// Receives moment object (valid) or string (invalid)
					onChange={handleChange}
					// renderInput={renderInput}
					inputProps={{ placeholder: fieldName, className: styles.inputField }}
					// Close once the day has been selected
					closeOnSelect={true}
				/>
			</div>
		);
	}
);
