import { useEffect, useMemo, useState } from 'react';
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
	value?: SelectOption[];
	placeholder?: string;
	loading?: boolean;
	autoFocus?: boolean;
}

export const ComboBox = ({
	options,
	onChange,
	onOpen,
	value = [],
	placeholder = 'Select',
	loading = false,
	mode,
	autoFocus = false,
}: SelectProps) => {
	const [selectedItems, setSelectedItems] = useState<SelectOption[]>(value);

	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);
	const { isOpen, getMenuProps, getInputProps, highlightedIndex, getItemProps } = useCombobox({
		items: options,
		onSelectedItemChange: handleSelectionChange,
		itemToString: (item) => item?.label ?? '',
	});

	useEffect(() => {
		if (isOpen) onOpen?.();
	}, [isOpen]);

	useEffect(() => {
		value !== selectedItems && onChange(selectedItems);
	}, [selectedItems]);

	function handleSelectionChange({ selectedItem }: any) {
		if (!selectedItem) return;
		if (mode === SelectMode.SINGLE) {
			setSelectedItems([selectedItem]);
		} else {
			setSelectedItems((_selectedOptions) => {
				const isOptionAlreadySelected = _selectedOptions.some(
					(selected) => selected.value === selectedItem.value
				);

				if (!isOptionAlreadySelected) {
					// If option is not found in _selectedOptions
					return [..._selectedOptions, selectedItem];
				}

				// return the original array as nothing has changed
				return _selectedOptions;
			});
		}
	}

	// This is only used when multi select is enabled
	const handleDeleteAll = () => setSelectedItems([]);

	const handleOnPillKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Backspace') handleDeleteAll();
		if (e.key === 'Delete') handleDeleteAll();
	};

	// Store the selected ids in an array for easy lookup
	const selectedIds = useMemo(
		() => new Set(selectedItems.map((item) => item.value)),
		[selectedItems]
	);

	return (
		<div className={styles.select}>
			<div className={`${styles.selectBox} ${isOpen ? styles.open : ''}`}>
				<input readOnly className={styles.selectInput} {...getInputProps({ ref: inputRef })} />
				{selectedItems.length > 0 ? (
					<div className={styles.selectedOptions}>
						<div className={styles.optionPill} tabIndex={0} onKeyDown={handleOnPillKeyDown}>
							<span className={styles.optionPillLabel}>
								{selectedItems.length > 1 || !selectedItems?.[0]?.label
									? `${selectedItems.length} Selected`
									: selectedItems?.[0].label}
							</span>
							<span className={styles.deleteOption} onClick={handleDeleteAll}>
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
