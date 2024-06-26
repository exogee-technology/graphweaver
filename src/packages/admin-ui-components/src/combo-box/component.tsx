import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';

import { Spinner } from '../spinner';
import { useAutoFocus } from '../hooks';
import styles from './styles.module.css';

export enum SelectMode {
	SINGLE = 'SINGLE',
	MULTI = 'MULTI',
}

export interface SelectOption {
	value: unknown;
	label?: string;
}

interface SelectProps {
	options: SelectOption[];
	onChange: (selected: SelectOption[]) => void;
	mode: SelectMode;
	onOpen?: () => void;
	value?: SelectOption | SelectOption[];
	placeholder?: string;
	loading?: boolean;
	autoFocus?: boolean;
	['data-testid']?: string;
}

function arrayify<T>(value: T) {
	if (Array.isArray(value)) return value;
	if (value !== null && value !== undefined) return [value];
	return [];
}

export const ComboBox = ({
	options,
	onChange,
	onOpen,
	mode,
	value = [],
	placeholder = 'Select',
	loading = false,
	autoFocus = false,
	['data-testid']: testId,
}: SelectProps) => {
	const valueArray = arrayify(value);

	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);
	const { isOpen, getMenuProps, getInputProps, highlightedIndex, getItemProps } = useCombobox({
		items: options,
		itemToString: (item) => item?.label ?? '',
		onSelectedItemChange: (change) => {
			if (mode === SelectMode.MULTI) {
				onChange([...valueArray, change.selectedItem]);
			} else {
				onChange([change.selectedItem]);
			}
		},
	});

	useEffect(() => {
		if (isOpen) onOpen?.();
	}, [isOpen]);

	const handleOnPillKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Backspace' || e.key === 'Delete') onChange([]);
	};

	// Store the selected ids in an array for easy lookup
	const selectedIds = useMemo(() => new Set(valueArray.map((item) => item.value)), [value]);

	return (
		<div className={styles.select} data-testid={testId}>
			<div className={`${styles.selectBox} ${isOpen ? styles.open : ''}`}>
				<input readOnly className={styles.selectInput} {...getInputProps({ ref: inputRef })} />
				{valueArray.length > 0 ? (
					<div className={styles.selectedOptions}>
						<div className={styles.optionPill} tabIndex={0} onKeyDown={handleOnPillKeyDown}>
							<span className={styles.optionPillLabel}>
								{valueArray.length > 1 || !valueArray[0].label
									? `${valueArray.length} Selected`
									: valueArray[0].label}
							</span>
							<span className={styles.deleteOption} onClick={() => onChange([])}>
								&times;
							</span>
						</div>
					</div>
				) : (
					<span className={styles.placeholder}>{placeholder}</span>
				)}

				<span className={`${styles.arrow} ${isOpen ? styles.arrowUp : styles.arrowDown}`}></span>
			</div>

			<ul className={styles.optionsDropdown} {...getMenuProps()}>
				{isOpen &&
					(loading ? (
						<Spinner />
					) : (
						options.map((item, index) => (
							<li
								className={clsx(styles.option, {
									[styles.highlighted]: highlightedIndex === index,
									[styles.selected]: selectedIds.has(item.value),
								})}
								key={item.value as any}
								{...getItemProps({ item, index })}
							>
								<span>{item.label}</span>
							</li>
						))
					))}
			</ul>
		</div>
	);
};
