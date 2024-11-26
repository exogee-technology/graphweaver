import React, { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import clsx from 'clsx';

import { Button } from '../button';
import { DateSelector } from './date-selector';

import styles from './styles.module.css';
import { CloseButtonIcon } from '../assets';

interface Props {
	onChange: (startDate?: DateTime, endDate?: DateTime) => void;
	placeholder?: string;
	isRangePicker?: boolean;
	startDate?: DateTime | string;
	endDate?: DateTime | string;
}

export const DatePicker = ({
	onChange,
	placeholder,
	isRangePicker = false,
	startDate,
	endDate,
}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const datePickerRef = useRef<HTMLDivElement>(null);

	const luxonStartDate = startDate
		? DateTime.isDateTime(startDate)
			? startDate
			: DateTime.fromISO(startDate)
		: undefined;
	const luxonEndDate = endDate
		? DateTime.isDateTime(endDate)
			? endDate
			: DateTime.fromISO(endDate)
		: undefined;

	const handleDateRangeSelect = (start?: DateTime, end?: DateTime) => {
		setIsOpen(false);
		onChange(start, end);
	};

	const clear = () => handleDateRangeSelect(undefined, undefined);

	const displayText = () => {
		if (luxonStartDate) {
			const selectedDatesText = [
				luxonStartDate.toFormat('dd/MM/yyyy'),
				luxonEndDate?.toFormat('dd/MM/yyyy'),
			];
			return isRangePicker
				? `${selectedDatesText.join('-')}`
				: luxonStartDate.toFormat('dd/MM/yyyy');
		} else {
			return placeholder ?? '';
		}
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
			close();
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	}, []);

	return (
		<div className={styles.container}>
			<div className={styles.inputSelector}>
				<div
					className={clsx(startDate && styles.inputFieldActive, styles.inputField)}
					onClick={() => setIsOpen((isOpen) => !isOpen)}
				>
					{displayText()}
				</div>
				{startDate && (
					<div className={styles.indicatorWrapper}>
						<span className={styles.indicatorSeparator}></span>
						<div className={styles.indicatorContainer}>
							<CloseButtonIcon className={styles.closeIcon} onClick={clear} />
						</div>
					</div>
				)}
			</div>
			{isOpen && (
				<div className={styles.popup} ref={datePickerRef}>
					<DateSelector
						startDate={luxonStartDate}
						endDate={luxonEndDate}
						onSelect={handleDateRangeSelect}
						isRangePicker={isRangePicker}
					/>
					<div className={styles.filterButtons}>
						<Button type="button" className={styles.finishButton} onClick={() => setIsOpen(false)}>
							Done
						</Button>
						<Button type="reset" className={styles.clearButton} onClick={clear}>
							Clear
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
