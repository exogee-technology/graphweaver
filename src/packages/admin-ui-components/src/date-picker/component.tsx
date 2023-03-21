import React, { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import classnames from 'classnames';

import { Button } from '../button';
import { DateSelector } from './date-selector';

import styles from './styles.module.css';
import { ExitIcon } from '../assets';

interface Props {
	onChange: (startDate?: DateTime, endDate?: DateTime) => void;
	placeholder?: string;
	isRangePicker?: boolean;
}

export const DatePicker = ({ onChange, placeholder, isRangePicker = false }: Props) => {
	const [startDate, setStartDate] = useState<DateTime | undefined>(undefined);
	const [endDate, setEndDate] = useState<DateTime | undefined>(undefined);
	const [isOpen, setIsOpen] = useState(false);
	const datePickerRef = useRef<HTMLDivElement>(null);

	const handleDateRangeSelect = (start?: DateTime, end?: DateTime) => {
		setStartDate(start);
		setEndDate(end);
		setIsOpen(false);
		onChange(start, end);
	};

	const close = () => {
		setIsOpen(false);
		onChange(startDate, endDate);
	};

	const clear = () => {
		setStartDate(undefined);
		setEndDate(undefined);
		setIsOpen(false);
	};

	const displayText = () => {
		if (startDate) {
			const selectedDatesText = [
				startDate.toFormat('dd/MM/yyyy'),
				endDate ? endDate.toFormat('dd/MM/yyyy') : undefined,
			];
			return `${selectedDatesText.join('-')}`;
		} else {
			return placeholder ?? '';
		}
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
			setIsOpen(false);
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
					className={classnames(startDate && styles.inputFieldActive, styles.inputField)}
					onClick={() => setIsOpen((isOpen) => !isOpen)}
				>
					{displayText()}
				</div>
				{startDate && (
					<div className={styles.indicatorWrapper}>
						<span className={styles.indicatorSeparator}></span>
						<div className={styles.indicatorContainer}>
							<ExitIcon className={styles.closeIcon} onClick={clear} />
						</div>
					</div>
				)}
			</div>
			{isOpen && (
				<div className={styles.popup} ref={datePickerRef}>
					<DateSelector
						startDate={startDate}
						endDate={endDate}
						onSelect={handleDateRangeSelect}
						onClose={close}
						isRangePicker={isRangePicker}
					/>
					<div className={styles.filterButtons}>
						<Button
							type={'button'}
							className={styles.finishButton}
							onClick={() => onChange(startDate, endDate)}
						>
							Done
						</Button>
						<Button type={'reset'} className={styles.clearButton} onClick={clear}>
							Clear
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
