import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { useEffect, useMemo, useRef } from 'react';

import { ChevronDownIcon } from '../assets';
import { useAutoFocus } from '../hooks';
import { Spinner } from '../spinner';
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
	const selectBoxRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLUListElement>(null);
	const {
		isOpen,
		getMenuProps,
		getInputProps,
		highlightedIndex,
		getItemProps,
		inputValue,
		setInputValue,
		toggleMenu,
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
				if (change.selectedItem) {
					if (selectedIds.has(change.selectedItem.value)) {
						onChange(valueArray.filter((item) => item.value !== change.selectedItem?.value));
					} else {
						onChange([...valueArray, change.selectedItem]);
					}
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

	// Position dropdown when opened
	useEffect(() => {
		if (isOpen && selectBoxRef.current && dropdownRef.current) {
			const selectRect = selectBoxRef.current.getBoundingClientRect();
			const dropdown = dropdownRef.current;

			dropdown.style.top = `${selectRect.bottom + window.scrollY + 2}px`;
			dropdown.style.left = `${selectRect.left + window.scrollX}px`;
			dropdown.style.width = `${Math.max(selectRect.width, 150)}px`;
		}
	}, [isOpen]);

	const handleOnPillKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Backspace' || e.key === 'Delete') onChange([]);
	};

	// Store the selected ids in an array for easy lookup
	const selectedIds = useMemo(() => new Set(valueArray.map((item) => item.value)), [value]);

	return (
		<div className={styles.select} data-testid={testId}>
			<div
				ref={selectBoxRef}
				className={clsx(styles.selectBox, isOpen && styles.open)}
				onClick={() => !disabled && toggleMenu()}
				data-testid={testId ? `${testId}-box` : undefined}
			>
				<div className={styles.inputContainer}>
					{valueArray.length > 0 && (
						<div className={styles.selectedOptions}>
							<div className={styles.optionPill} tabIndex={0} onKeyDown={handleOnPillKeyDown}>
								<span className={styles.optionPillLabel}>
									{valueArray.length > 1
										? `${valueArray.length} Selected`
										: (valueArray[0].label ??
											options.find((option) => option.value === valueArray[0])?.label ??
											'1 Selected')}
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
								data-testid={testId ? `${testId}-input` : undefined}
								{...getInputProps({
									ref: inputRef,
									onBlur: handleBlur,
									onFocus: toggleMenu,
									placeholder: valueArray.length === 0 ? placeholder : undefined,
								})}
							/>
						</div>
					)}
				</div>

				<span className={styles.arrow}>
					<ChevronDownIcon />
				</span>
			</div>

			<ul ref={dropdownRef} className={styles.optionsDropdown} {...getMenuProps()}>
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
