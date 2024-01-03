import React, { useState, useRef, useEffect } from 'react';
import { Spinner } from '../spinner';
import styles from './styles.module.css';

export interface SelectOption {
	value: unknown;
	label?: string;
}

export enum SelectMode {
	SINGLE = 'SINGLE',
	MULTI = 'MULTI',
}

interface SelectProps {
	options: SelectOption[];
	onChange: (selected: SelectOption[]) => void;
	onOpen?: () => void;
	value?: SelectOption[];
	placeholder?: string;
	loading?: boolean;
	mode?: SelectMode;
}

export const Select = ({
	options,
	onChange,
	onOpen,
	value = [],
	placeholder = 'Select',
	loading = false,
	mode = SelectMode.MULTI,
}: SelectProps) => {
	const [open, setOpen] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>(value.flat());
	const selectBoxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) onOpen?.();
	}, [open]);

	const handleClick = (option: SelectOption) => {
		if (mode === SelectMode.SINGLE) {
			setSelectedOptions([option]);
		} else {
			setSelectedOptions((_selectedOptions) => {
				const isOptionAlreadySelected = _selectedOptions.some(
					(selected) => selected.value === option.value
				);

				if (!isOptionAlreadySelected) {
					// If option is not found in _selectedOptions
					return [..._selectedOptions, option];
				}

				// return the original array as nothing has changed
				return _selectedOptions;
			});
		}
	};

	// This is only used when multi select is enabled
	const handleDelete = (option: SelectOption) => {
		setSelectedOptions((_selectedOptions) =>
			_selectedOptions.filter((selected) => selected.value !== option.value)
		);
	};

	// This is only used when multi select is enabled
	const handleDeleteAll = () => {
		setSelectedOptions([]);
	};

	const handleToggleDropdown = () => {
		setOpen((prev) => !prev);
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (selectBoxRef.current && !selectBoxRef.current.contains(event.target as Node)) {
			setOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	}, []);

	useEffect(() => {
		value !== selectedOptions && onChange(selectedOptions);
	}, [selectedOptions]);

	return (
		<div className={styles.multiSelect}>
			<div
				className={`${styles.selectBox} ${open ? styles.open : ''}`}
				onClick={handleToggleDropdown}
				ref={selectBoxRef}
			>
				{selectedOptions.length > 0 ? (
					<div className={styles.selectedOptions}>
						<div className={styles.optionPill}>
							<span className={styles.optionPillLabel}>
								{selectedOptions.length > 1 || !selectedOptions?.[0]?.label
									? `${selectedOptions.length} Selected`
									: selectedOptions?.[0].label}
							</span>
							{mode === SelectMode.MULTI && (
								<span className={styles.deleteOption} onClick={handleDeleteAll}>
									&times;
								</span>
							)}
						</div>
					</div>
				) : (
					<div className={styles.placeholder}>{placeholder}</div>
				)}
				<div className={styles.optionsDropdownBackground}></div>
				<div className={styles.optionsDropdown}>
					<>
						{loading && <Spinner />}
						{!loading && (
							<>
								<div className={styles.selectedOptions}>
									{mode === SelectMode.MULTI &&
										selectedOptions.map((option) => (
											<div className={styles.optionPill} key={`${option?.value}:OptionPill`}>
												<span className={styles.optionPillLabel}>{option.label}</span>
												<span className={styles.deleteOption} onClick={() => handleDelete(option)}>
													&times;
												</span>
											</div>
										))}
								</div>
								{options.map((option) => (
									<div
										className={`${styles.option} ${
											selectedOptions.find((selected) => selected.value === option.value)
												? styles.selected
												: ''
										}`}
										key={`${option?.value}:Option`}
										onClick={() => handleClick(option)}
									>
										{option.label}
									</div>
								))}
							</>
						)}
					</>
				</div>
				<span className={`${styles.arrow} ${open ? styles.arrowUp : styles.arrowDown}`}></span>
			</div>
		</div>
	);
};
