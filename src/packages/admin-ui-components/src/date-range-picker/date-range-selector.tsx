import { DateTime } from 'luxon';
import { useState } from 'react';
import styles from './date-range-selector.module.css';

interface Props {
	startDate?: DateTime;
	endDate?: DateTime;
	onSelect: (startDate?: DateTime, endDate?: DateTime) => void;
	onClose: () => void;
}

export const DateRangeSelector = ({ startDate, endDate, onSelect, onClose }: Props) => {
	const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.local());
	const [selectedStartDate, setSelectedStartDate] = useState<DateTime | undefined>(startDate);
	const [selectedEndDate, setSelectedEndDate] = useState<DateTime | undefined>(endDate);

	const handleMonthChange = (month: DateTime) => {
		setCurrentMonth(month);
	};

	const handleDayClick = (day: DateTime) => {
		if (!selectedStartDate && !selectedEndDate) {
			setSelectedStartDate(day);
		} else if (selectedStartDate && !selectedEndDate && day > selectedStartDate) {
			setSelectedEndDate(day);
			onSelect(selectedStartDate, day);
		} else {
			setSelectedStartDate(day);
			setSelectedEndDate(undefined);
		}
	};

	const renderDay = (day: DateTime) => {
		const isStart = selectedStartDate && day.hasSame(selectedStartDate, 'day');
		const isEnd = selectedEndDate && day.hasSame(selectedEndDate, 'day');
		const isRange =
			selectedStartDate && selectedEndDate && day >= selectedStartDate && day <= selectedEndDate;
		const isMuted = !day.hasSame(currentMonth, 'month');
		const isSelected = !isMuted && (isStart || isEnd || isRange);

		return (
			<div
				key={day.toISODate()}
				className={`${styles.day} ${isMuted ? styles.muted : ''} ${
					isSelected ? styles.selected : ''
				} ${isRange ? styles.range : ''}`}
				onClick={() => handleDayClick(day)}
			>
				{day.day}
			</div>
		);
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<button
					className={styles.monthButton}
					onClick={() => handleMonthChange(currentMonth.minus({ month: 1 }))}
				>{`<`}</button>
				<div>{currentMonth.toFormat('MMMM yyyy')}</div>
				<button
					className={styles.monthButton}
					onClick={() => handleMonthChange(currentMonth.plus({ month: 1 }))}
				>{`>`}</button>
			</div>
			<div className={styles.daysContainer}>
				{[...Array(currentMonth.daysInMonth).keys()]
					.map((day) => currentMonth.set({ day: day + 1 }))
					.map((day) => renderDay(day))}
			</div>
		</div>
	);
};
