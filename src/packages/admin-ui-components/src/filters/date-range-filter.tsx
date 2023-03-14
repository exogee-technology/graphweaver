import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import classnames from 'classnames';
import { DateRange as ReactDateRange, Range, RangeKeyDict } from 'react-date-range';

import { SelectOption } from '../select';
import { Button } from '../button';
import { ExitIcon } from '../assets';

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import styles from './styles.module.css';

export const DateRangeFilter = React.forwardRef(
	(
		{
			fieldName,
			entity,
			onSelect,
			selectedStart,
			selectedEnd,
		}: {
			fieldName: string;
			entity: string;
			onSelect?: (fieldName: string, start?: SelectOption, end?: SelectOption) => void;
			selectedStart?: SelectOption;
			selectedEnd?: SelectOption;
		},
		ref: any
	) => {
		const [show, setShow] = useState(false);
		const [buttonText, setButtonText] = useState('DATE');
		const [selectedDateRange, setSelectedDateRange] = useState<Range>({
			startDate: undefined,
			endDate: new Date(''),
			key: 'selection',
		});

		const onChange = (ranges: RangeKeyDict) => {
			setSelectedDateRange(ranges.selection);
		};

		const clearSelection = () => {
			setShow(false);
			setSelectedDateRange({
				startDate: undefined,
				endDate: new Date(''),
				key: 'selection',
			});
		};

		const onSelectedRange = () => {
			setShow(false);
			if (!onSelect) return;
			if (selectedDateRange.startDate === undefined) {
				return onSelect(fieldName, undefined, undefined);
			}
			return onSelect(
				fieldName,
				{ label: 'selectedDate', value: selectedDateRange.startDate },
				{ label: 'selectedEndDate', value: selectedDateRange.endDate }
			);
		};

		const showCalendar = () => setShow(true);

		const showSelection = () => {
			if (!show) {
				if (selectedDateRange.startDate) {
					const selectedDatesText = [
						format(selectedDateRange.startDate, 'dd/MM/yyyy'),
						selectedDateRange.endDate ? format(selectedDateRange.endDate, 'dd/MM/yyyy') : undefined,
					];
					setButtonText(`${selectedDatesText.join('-')}`);
				}
			} else {
				setButtonText('DATE');
			}
		};

		// synchronization
		useEffect(() => {
			showSelection();
		}, [show]);

		useEffect(() => {
			const startDate = selectedStart ? new Date(selectedStart.value) : undefined;
			const endDate = selectedEnd ? new Date(selectedEnd.value) : new Date('');
			setSelectedDateRange({
				startDate,
				endDate,
				key: 'selection',
			});
			if (!selectedStart) {
				setButtonText('DATE');
			}
		}, [selectedStart, selectedEnd]);

		//@todo: NB dates are UTC but the filter is local
		return (
			<React.Fragment>
				{!show && (
					<div className={styles.dateRangeSelector} onClick={showCalendar}>
						<div
							className={classnames(
								selectedDateRange.startDate && styles.inputFieldActive,
								styles.inputField
							)}
						>
							{buttonText}
						</div>
						<div className={styles.indicatorWrapper}>
							<span className={styles.indicatorSeparator}></span>
							<div className={styles.indicatorContainer}>
								<ExitIcon className={styles.closeIcon} onClick={clearSelection} />
							</div>
						</div>
					</div>
				)}
				{show && (
					<div className={styles.dateRangeWrapper}>
						<ReactDateRange
							startDatePlaceholder="date from"
							endDatePlaceholder="date to"
							onChange={onChange}
							classNames={{
								calendarWrapper: styles.calendarWrapper,
								dateDisplayItem: styles.dateDisplayItem,
								dateDisplayWrapper: styles.dateDisplayWrapper,
								dateDisplay: styles.dateDisplay,
								monthAndYearPickers: styles.monthAndYearPickers,
								dayNumber: styles.dayNumber,
								dayPassive: styles.dayPassive,
								dayToday: styles.dayToday,
								dayHovered: styles.dayHovered,
							}}
							editableDateInputs={true}
							moveRangeOnFirstSelection={false}
							months={1}
							dateDisplayFormat={'yyyy-MM-dd'}
							ranges={[selectedDateRange]}
							direction="horizontal"
						/>
						<div className={styles.calendarButtons}>
							<Button type={'button'} className={styles.finishButton} onClick={onSelectedRange}>
								Done
							</Button>
							<Button type={'reset'} className={styles.clearButton} onClick={clearSelection}>
								Clear
							</Button>
						</div>
					</div>
				)}
			</React.Fragment>
		);
	}
);
