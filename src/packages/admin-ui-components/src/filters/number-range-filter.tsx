import React, { ChangeEvent, useEffect, useReducer, useState } from 'react';
import { Button } from '../button';
import { SelectOption } from '../';
import { FilterSelector } from './filter-selector';

import styles from './styles.module.css';

interface NumberRange {
	minAmount?: number;
	maxAmount?: number;
}

interface NumberRangeFilterProps {
	fieldName: string;
	onSelect?: (fieldName: string, min?: SelectOption, max?: SelectOption) => void;
	selectedMin?: SelectOption;
	selectedMax?: SelectOption;
}

export const NumberRangeFilter = ({
	fieldName,
	onSelect,
	selectedMin,
	selectedMax,
}: NumberRangeFilterProps) => {
	const [show, setShow] = useState(false);
	const [buttonText, setButtonText] = useState(fieldName);
	const [range, setRange] = useReducer((prev: NumberRange, next: NumberRange) => {
		const newRange = { ...prev, ...next };
		return newRange;
	}, {});

	// synchronization
	useEffect(() => {
		showSelection();
	}, [show]);

	useEffect(() => {
		setRange({
			minAmount: selectedMin?.value,
			maxAmount: selectedMax?.value,
		});
		if (!selectedMin && !selectedMax) {
			setButtonText(fieldName);
		}
	}, [selectedMin, selectedMax]);

	const showFilter = () => setShow(true);

	const onChangeMin = (event: ChangeEvent<HTMLInputElement>) => {
		setRange({ ...range, minAmount: +event.target.value });
	};

	const onChangeMax = (event: ChangeEvent<HTMLInputElement>) => {
		setRange({ ...range, maxAmount: +event.target.value });
	};

	const clearSelection = () => {
		setShow(false);
		setRange({});
	};

	const onSelectedRange = () => {
		setShow(false);
		if (!onSelect) return;
		const minAmount = range.minAmount ? { label: 'minAmount', value: range.minAmount } : undefined;
		const maxAmount = range.maxAmount ? { label: 'maxAmount', value: range.maxAmount } : undefined;
		return onSelect(fieldName, minAmount, maxAmount);
	};

	const showSelection = () => {
		if (!show) {
			if (range.minAmount || range.maxAmount) {
				setButtonText(Object.values(range).join('-'));
			}
		} else {
			setButtonText(fieldName);
		}
	};

	return (
		<React.Fragment>
			{!show && (
				<FilterSelector
					showFilter={showFilter}
					clearFilter={clearSelection}
					active={range.minAmount !== undefined || range.maxAmount !== undefined}
				>
					{buttonText}
				</FilterSelector>
			)}
			{show && (
				<div className={styles.numericInputWrapper}>
					<div className={styles.numericInput}>
						<input
							type={'number'}
							key={`${fieldName}Min`}
							placeholder={`${fieldName} Min`}
							value={range.minAmount}
							onChange={onChangeMin}
						/>
						<input
							type={'number'}
							key={`${fieldName}Max`}
							placeholder={`${fieldName} Max`}
							value={range.maxAmount}
							onChange={onChangeMax}
						/>
					</div>
					<div className={styles.filterButtons}>
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
};
