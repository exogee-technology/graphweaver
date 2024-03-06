import classNames from 'classnames';
import { useSelect } from 'downshift';
import { useEffect, useMemo, useRef, useState } from 'react';

import { autoFocusDelay } from '../config';
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
	value?: SelectOption[];
	placeholder?: string;
	loading?: boolean;
	autoFocus?: boolean;
}

export const Select = ({
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

	const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
		items: options,
		onSelectedItemChange: handleSelectionChange,
		itemToString: (item) => item?.label ?? '',
	});

	// const toggleButtonRef = useRef<HTMLDivElement>(null);
	// useEffect(() => {
	// 	if (autoFocus) {
	// 		setTimeout(() => {
	// 			toggleButtonRef.current?.focus();
	// 		}, autoFocusDelay);
	// 	}
	// }, [autoFocus]);

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
	const selectedIds = useMemo(() => selectedItems.map((item) => item.value), [selectedItems]);

	return (
		<div className={styles.select}>
			<div
				className={`${styles.selectBox} ${isOpen ? styles.open : ''}`}
				{...getToggleButtonProps()}
			>
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
								className={classNames(styles.option, {
									[styles.highlighted]: highlightedIndex === index,
									[styles.selected]: selectedIds.includes(item.value),
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
