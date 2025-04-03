import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';

import { ChevronDownIcon } from '../assets';
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
	disabled?: boolean;
	allowFreeTyping?: boolean;
	onInputChange?: (inputValue: string) => void;
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
	disabled = false,
	allowFreeTyping = false,
	onInputChange,
	['data-testid']: testId,
}: SelectProps) => {
	const valueArray = arrayify(value);
	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);
	const {
		isOpen,
		getMenuProps,
		getInputProps,
		highlightedIndex,
		getItemProps,
		inputValue,
		setInputValue,
	} = useCombobox({
		items: options,
		itemToString: (item) => item?.label ?? '',
		isItemDisabled: () => disabled,
		onInputValueChange: ({ inputValue }) => {
			if (allowFreeTyping && onInputChange && inputValue !== undefined) {
				onInputChange(inputValue);
			}
		},
		onSelectedItemChange: (change) => {
			setInputValue('');

			if (mode === SelectMode.MULTI) {
				if (change.selectedItem && !selectedIds.has(change.selectedItem.value)) {
					onChange([...valueArray, change.selectedItem]);
				}
			} else {
				onChange(change.selectedItem ? [change.selectedItem] : []);
			}
		},
	});

	// Clear typed text on blur if no item was selected
	const handleBlur = () => {
		if (allowFreeTyping && inputValue) {
			// Check if the input matches any option
			const matchingOption = options.find(
				(option) => option.label?.toLowerCase() === inputValue.toLowerCase()
			);

			// Clear input if no match found
			if (!matchingOption) {
				setInputValue('');
			}
		}
	};

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
			<div className={clsx(styles.selectBox, isOpen && styles.open)}>
				<div className={styles.inputContainer}>
					{valueArray.length > 0 && (
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
					)}

					{(allowFreeTyping || valueArray.length === 0) && (
						<div className={styles.inputWrapper}>
							<input
								readOnly={!allowFreeTyping}
								className={styles.selectInput}
								{...getInputProps({
									ref: inputRef,
									onBlur: handleBlur,
									placeholder: valueArray.length === 0 ? placeholder : '',
								})}
							/>
						</div>
					)}
				</div>

				{valueArray.length === 0 && !inputValue && (
					<span className={styles.placeholder}>{placeholder}</span>
				)}

				<span className={styles.arrow}>
					<ChevronDownIcon />
				</span>
			</div>

			<ul className={styles.optionsDropdown} role="listbox" {...getMenuProps()}>
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
								data-testid={`combo-option-${item.label}`}
							>
								<span>{item.label}</span>
							</li>
						))
					))}
			</ul>
		</div>
	);
};
