import classNames from 'classnames';
import { useSelect } from 'downshift';

import { Spinner } from '../spinner';
import styles from './styles.module.css';
import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
	value: unknown;
	label?: string;
}

interface SelectProps {
	options: SelectOption[];
	onChange: (selected: SelectOption[]) => void;
	onOpen?: () => void;
	value?: SelectOption[];
	placeholder?: string;
	loading?: boolean;
}

export const Select = ({
	options,
	onChange,
	onOpen,
	value = [],
	placeholder = 'Select',
	loading = false,
}: SelectProps) => {
	const [selectedItem, setSelectedItem] = useState<SelectOption>(value?.[0]);
	const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
		items: options,
		selectedItem: value[0],
		onSelectedItemChange: ({ selectedItem }) => {
			if (selectedItem) {
				setSelectedItem(selectedItem);
			}
		},
		itemToString: (item) => (item?.label ? item.label : ''),
	});

	useEffect(() => {
		if (isOpen) onOpen?.();
	}, [isOpen]);

	useEffect(() => {
		value?.[0] !== selectedItem && onChange([selectedItem]);
	}, [selectedItem]);

	return (
		<div className={styles.select}>
			<div
				className={`${styles.selectBox} ${isOpen ? styles.open : ''}`}
				{...getToggleButtonProps()}
			>
				<span className={`${styles.selection} ${selectedItem ? '' : styles.placeholder}`}>
					{selectedItem ? selectedItem.label : placeholder}
				</span>

				<span className={`${styles.arrow} ${isOpen ? styles.arrowUp : styles.arrowDown}`}></span>
			</div>
			<ul className={styles.optionsDropdown} {...getMenuProps()}>
				{isOpen && loading ? (
					<Spinner />
				) : (
					isOpen &&
					options.map((item, index) => (
						<li
							className={`${highlightedIndex === index ? styles.highlighted : ''} ${
								selectedItem === item ? styles.selected : ''
							} ${styles.option}`}
							key={item.value as any}
							{...getItemProps({ item, index })}
						>
							<span>{item.label}</span>
						</li>
					))
				)}
			</ul>
		</div>
	);
};
