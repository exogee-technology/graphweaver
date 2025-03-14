import { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import clsx from 'clsx';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button } from '../button';
import styles from './styles.module.css';
import { CloseButtonIcon } from '../assets';
import { TimeInput } from './time-input';
import { AdminUIFilterType } from '../utils';
import { dateTimeFieldTypes } from '../filters';
import { getFormat, setTime, toLuxonDate } from './utils';

interface Props {
	onChange: (startDate?: DateTime, endDate?: DateTime) => void;
	placeholder?: string;
	isRangePicker?: boolean;
	startDate?: DateTime | string;
	endDate?: DateTime | string;
	filterType: AdminUIFilterType.DATE_TIME_RANGE | AdminUIFilterType.DATE_RANGE;
	fieldType: string;
}

export const DatePicker = ({
	onChange,
	placeholder,
	isRangePicker = false,
	startDate,
	endDate,
	filterType,
	fieldType,
}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const datePickerRef = useRef<HTMLDivElement>(null);

	const luxonStartDate = toLuxonDate(startDate);
	const luxonEndDate = toLuxonDate(endDate);

	const handleDateRangeSelect = (start?: DateTime, end?: DateTime) => {
		const shouldHandleTimeBehindTheScenes =
			filterType === AdminUIFilterType.DATE_RANGE && dateTimeFieldTypes.has(fieldType);

		// Set the new date, but keep the time
		// If the time is handled behind the scenes (time is not shown to user but dataType has time) then let's handle it.
		// Otherwise, the time is whatever the user has said the time is, which is already set in the previous state (which is the startDate and endDate variables)
		start = shouldHandleTimeBehindTheScenes
			? start?.startOf('day')
			: setTime(start, startDate, DateTime.now().startOf('day'));
		end = shouldHandleTimeBehindTheScenes
			? (end?.endOf('day') ?? start?.endOf('day'))
			: setTime(end, endDate, DateTime.now().endOf('day'));

		onChange(start, end);
	};

	const handleTimeInputChange = (mode: 'start' | 'end') => (start?: DateTime, end?: DateTime) => {
		// set the new time but keep the date
		if (mode === 'start') {
			start = setTime(startDate, start, DateTime.now().startOf('day'));
		}
		if (mode === 'end') {
			end = setTime(endDate, end, DateTime.now().endOf('day'));
		}
		onChange(start, end);
	};

	const clear = () => {
		handleDateRangeSelect(undefined, undefined);
		setIsOpen(false);
	};

	const displayText = () => {
		const withTime = filterType === AdminUIFilterType.DATE_TIME_RANGE;
		if (luxonStartDate) {
			const selectedDatesText = [
				luxonStartDate.toFormat(getFormat(withTime)),
				luxonEndDate?.toFormat(getFormat(withTime)),
			];
			return isRangePicker
				? `${selectedDatesText.join('-')}`
				: luxonStartDate.toFormat(getFormat(withTime));
		} else {
			return placeholder ?? '';
		}
	};

	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

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

					{filterType === AdminUIFilterType.DATE_TIME_RANGE && !isRangePicker && (
						<div className={styles.timeSelector}>
							Time:
							<TimeInput
								value={luxonStartDate}
								setValue={handleTimeInputChange('start')}
								defaultTime="00:00:00"
							/>
						</div>
					)}
					{filterType === AdminUIFilterType.DATE_TIME_RANGE && isRangePicker && (
						<div className={styles.timeSelector}>
							From:{' '}
							<TimeInput
								value={luxonStartDate}
								setValue={(value) => handleTimeInputChange('start')(value, luxonEndDate)}
								defaultTime="00:00:00"
							/>
							<div style={{ width: '5px' }}> </div>
							To:{' '}
							<TimeInput
								value={luxonEndDate}
								setValue={(value) => handleTimeInputChange('end')(luxonStartDate, value)}
								defaultTime="23:59:59"
							/>
						</div>
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
