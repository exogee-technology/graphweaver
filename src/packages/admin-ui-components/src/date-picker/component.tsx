import React, { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import clsx from 'clsx';
import { DayPicker } from 'react-day-picker';

import 'react-day-picker/style.css';

import { Button } from '../button';

import styles from './styles.module.css';
import { CloseButtonIcon } from '../assets';

interface Props {
	onChange: (startDate?: DateTime, endDate?: DateTime) => void;
	placeholder?: string;
	isRangePicker?: boolean;
	startDate?: DateTime | string;
	endDate?: DateTime | string;
}

const toLuxonDate = (date: Date | DateTime | string | undefined) => {
	if (DateTime.isDateTime(date)) return date;
	if (typeof date === 'string') return DateTime.fromISO(date);
	if (date instanceof Date) return DateTime.fromJSDate(date);
	return undefined;
};

export const DatePicker = ({
	onChange,
	placeholder,
	isRangePicker = false,
	startDate,
	endDate,
}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const datePickerRef = useRef<HTMLDivElement>(null);

	const luxonStartDate = toLuxonDate(startDate);
	const luxonEndDate = toLuxonDate(endDate);

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
					{isRangePicker ? (
						<DayPicker
							mode="range"
							selected={{ from: luxonStartDate?.toJSDate(), to: luxonEndDate?.toJSDate() }}
							onSelect={(range) =>
								handleDateRangeSelect(toLuxonDate(range?.from), toLuxonDate(range?.to))
							}
							defaultMonth={luxonStartDate?.toJSDate()}
							captionLayout="dropdown"
						/>
					) : (
						<DayPicker
							mode="single"
							selected={luxonStartDate?.toJSDate()}
							onSelect={(date) => handleDateRangeSelect(toLuxonDate(date))}
							defaultMonth={luxonStartDate?.toJSDate()}
							captionLayout="dropdown"
						/>
					)}

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
