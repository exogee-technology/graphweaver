import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronDownIcon } from '../assets';
import { useAutoFocus } from '../hooks';
import { Spinner, SpinnerSize } from '../spinner';
import styles from './styles.module.css';

export enum SelectMode {
	SINGLE = 'SINGLE',
	MULTI = 'MULTI',
}

export interface SelectOption {
	value: unknown;
	label?: string;
}

export interface DataFetchOptions {
	page: number;
	searchTerm?: string;
}

export type DataFetcher = (options: DataFetchOptions) => Promise<SelectOption[]>;

interface SelectProps {
	options?: SelectOption[];
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
	fieldId?: string;
	// Lazy loading props
	dataFetcher?: DataFetcher;
	pageSize?: number;
	searchDebounceMs?: number;
}

function arrayify<T>(value: T) {
	if (Array.isArray(value)) return value;
	if (value !== null && value !== undefined) return [value];
	return [];
}

export const ComboBox = ({
	options: staticOptions,
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
	fieldId,
	// Lazy loading props
	dataFetcher,
	searchDebounceMs = 300,
}: SelectProps) => {
	const valueArray = arrayify(value);
	const inputRef = useAutoFocus<HTMLInputElement>(autoFocus);
	const selectBoxRef = useRef<HTMLDivElement>(null);

	// Lazy loading state
	const [dynamicOptions, setDynamicOptions] = useState<SelectOption[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasReachedEnd, setHasReachedEnd] = useState(false);
	const lastSearchTermRef = useRef<string | undefined>(undefined);
	// We need this to scroll the menu to the top when the dropdown is opened.
	const dropdownRef = useRef<HTMLUListElement>(null);

	// Use ref to track if we're already loading data to prevent duplicate fetches
	const fetchedPagesRef = useRef(new Set<number>());

	// Calculate items once - use dynamic options if dataFetcher is provided, otherwise use static options
	const options = useMemo(() => {
		return dataFetcher ? dynamicOptions : staticOptions || [];
	}, [dataFetcher, dynamicOptions, staticOptions]);

	// Store the selected ids in a set for easy lookup - this is our source of truth for selection
	const selectedIds = useMemo(() => new Set(valueArray.map((item) => item.value)), [valueArray]);

	
	const sortOptionsBySelectedFirst = (opt1: SelectOption, opt2: SelectOption) => {
		return (selectedIds.has(opt2.value) ? 1 : 0) - (selectedIds.has(opt1.value) ? 1 : 0)
	}

	// Handle individual item deselection
	const handleItemDeselect = useCallback(
		(itemToRemove: SelectOption) => {
			onChange(valueArray.filter((item) => item.value !== itemToRemove.value));
		},
		[onChange, valueArray]
	);

	const {
		isOpen,
		getMenuProps,
		getInputProps,
		highlightedIndex,
		getItemProps,
		inputValue,
		setInputValue,
		getToggleButtonProps,
		openMenu,
		toggleMenu,
		closeMenu,
	} = useCombobox({
		items: options,
		id: fieldId,
		itemToString: (item) => item?.label ?? '',
		isItemDisabled: () => disabled,
		onInputValueChange: ({ inputValue }) => {
			onInputChange?.(inputValue);

			if (dataFetcher && inputValue !== undefined) {
				fetchedPagesRef.current.clear();
				setDynamicOptions([]);
				setCurrentPage(1);
				setHasReachedEnd(false);
				setSearchTerm(inputValue);
			}
		},
		onSelectedItemChange: (change) => {
			setInputValue('');

			if (mode === SelectMode.MULTI) {
				if (change.selectedItem) {
					if (selectedIds.has(change.selectedItem.value)) {
						handleItemDeselect(change.selectedItem)
					} else {
						onChange([...valueArray, change.selectedItem]);
					}
				}
			} else {
				onChange(change.selectedItem ? [change.selectedItem] : []);
			}
		},
		stateReducer: (_state, actionAndChanges) => {
			const { changes, type } = actionAndChanges;
			switch (type) {
			case useCombobox.stateChangeTypes.InputKeyDownEnter:
			case useCombobox.stateChangeTypes.ItemClick:
				return {
				...changes,
				// Keep the menu open after selection, if it's a multi-select
				/* TODO: It would be much nicer UX if the menu didn't collapse every time you made a selection, 
				 * if you're trying to select multiple options. There's a bug in the fetching logic at the moment,
				 * something to do with the 'search' value being changed to the selected option when you click.
				 */ 
				// isOpen: mode === SelectMode.MULTI, 
				}
			}
			return changes
		},
	});

	

	const fetchData = useCallback(
		async (page: number, search: string) => {
			if (!dataFetcher) return;

			// Check if we've already loaded this page.
			if (fetchedPagesRef.current.has(page)) return;

			// Mark this fetch as in progress
			fetchedPagesRef.current.add(page);
			setIsLoadingMore(true);

			try {
				const result = await dataFetcher({ page, searchTerm: search });

				if (lastSearchTermRef.current === search) {
					// Search term hasn't changed, merge the options in.
					if (result && result.length > 0) {
						setDynamicOptions((prev) => [...prev, ...result]);
						setCurrentPage(page);
					} else {
						setHasReachedEnd(true);
					}
				} else {
					// If the search term has changed, we need to reset the options
					setDynamicOptions(result);
					setCurrentPage(1);
					setHasReachedEnd(false);
					fetchedPagesRef.current.clear();
					fetchedPagesRef.current.add(1);
				}
			} catch (error) {
				console.error('ComboBox fetchData error:', error);
			} finally {
				lastSearchTermRef.current = search;
				setIsLoadingMore(false);
			}
		},
		[dataFetcher, isOpen]
	);

	// Scroll the menu to the top when it's opened.
	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			dropdownRef.current.scrollTop = 0;
		}
	}, [isOpen]);

	// Handle search with debouncing - moved here after useCombobox where isOpen is available
	useEffect(() => {
		// Only trigger search if dropdown is open AND we have a dataFetcher
		if (dataFetcher && searchTerm !== undefined && isOpen) {
			const timeout = setTimeout(() => {
				fetchData(1, searchTerm);
			}, searchDebounceMs);

			setSearchTimeout(timeout);
		}

		return () => {
			if (searchTimeout) clearTimeout(searchTimeout);
		};
	}, [searchTerm, dataFetcher, searchDebounceMs, isOpen]);

	// Infinite scroll handler - fetches more data when user scrolls to bottom
	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLUListElement>) => {
			if (!dataFetcher || isLoadingMore || hasReachedEnd) return;

			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			const threshold = 50; // pixels from bottom

			if (scrollHeight - scrollTop - clientHeight < threshold) {
				fetchData(currentPage + 1, searchTerm);
			}
		},
		[dataFetcher, isLoadingMore, hasReachedEnd, currentPage, searchTerm]
	);

	useEffect(() => {
		// Load initial data when dropdown is first opened.
		// If the fetch has already happened this request is ignored.
		if (dataFetcher && isOpen) fetchData(1, searchTerm);
	}, [dataFetcher, isOpen, searchTerm]);

	// Clear typed text on blur if no item was selected
	const handleBlur = useCallback(() => {
		if (allowFreeTyping && inputValue) {
			// Check if the input matches any option
			const matchingOption = options.find(
				(option) => option.label?.toLowerCase() === inputValue.toLowerCase()
			);

			// Clear input if no match found
			if (!matchingOption) setInputValue('');
		}
	}, [allowFreeTyping, inputValue, options, setInputValue]);

	useEffect(() => {
		if (isOpen) onOpen?.();
	}, [isOpen]);

	const handleOnPillKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Backspace' || e.key === 'Delete') {
				onChange([]);
				if (isOpen) closeMenu();
			}
		},
		[onChange, isOpen, closeMenu]
	);

	return (
		<div className={styles.select} data-testid={testId}>
			<div
				ref={selectBoxRef}
				className={clsx(styles.selectBox, isOpen && styles.open)}
				onClick={() => {
					if (!disabled) {
						toggleMenu();
					}
				}}
				
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
											options.find((option) => option.value === valueArray[0].value)?.label ??
											'1 Selected')}
								</span>
								<button
									type="button"
									className={styles.deleteOption}
									onClick={() => {
										onChange([]);
									}}
									aria-label="Clear selection"
								>
									&times;
								</button>
							</div>
						</div>
					)}
						<div className={styles.inputWrapper}>
							{/* This input needs to render always. Keyboard navigation will break without it. */}
							<input
								readOnly={!allowFreeTyping}
								className={styles.selectInput}
								data-testid={testId ? `${testId}-input` : undefined}
								{...getInputProps({
									ref: inputRef,
									onBlur: handleBlur,
									onFocus: openMenu,
									placeholder: valueArray.length === 0 ? placeholder : undefined
								})}
							/>
						</div>
					<button
						type="button"
						{...getToggleButtonProps({
							onClick: () => !disabled && toggleMenu(),
							onKeyDown: () => !disabled && toggleMenu()
						})}
						className={clsx(styles.arrow, isOpen && styles.arrowOpen)}
						aria-label="Toggle dropdown"
						aria-expanded={isOpen}
						disabled={disabled}
					>
						<ChevronDownIcon />
					</button>
				</div>

				
			</div>

			<ul
				className={styles.optionsDropdown}
				{...getMenuProps({ ref: dropdownRef })}
				onScroll={handleScroll}
			>
				{isOpen &&
					(loading ? (
						<Spinner />
					) : (
						<>
							{
								// The sort function bumps any selected options to the top of the list.
								options.sort(sortOptionsBySelectedFirst).map((item, index) => {
								const isSelected = selectedIds.has(item.value);
								const testId = `${isSelected ? 'selected' : 'combo'}-option-${item.label}`
								return (
									<li
										className={clsx(
											styles.option,
											{ 
												[styles.selectedOption]: isSelected,
												[styles.highlighted]: highlightedIndex === index,
												[styles.selectedOptionHighlighted]: isSelected &&  highlightedIndex === index,
											}
										)}
										key={String(item.value)}
										aria-label={item.label}
										{...getItemProps({ item, index })}
										data-testid={testId}
										
									>
										<span>{item.label}</span>
										{isSelected && (
											<span>
												&times;
											</span>
										)}
									</li>
								);
							})}

							{/* Show a message if there are no options */}
							{options.length === 0 && (
								<li className={clsx(styles.option, styles.nonSelectableOption)}>
									No options found
								</li>
							)}

							{/* Show loading indicator for lazy loading */}
							{dataFetcher && isLoadingMore && (
								<li className={styles.loadingMore}>
									<Spinner size={SpinnerSize.SMALL} />
								</li>
							)}
						</>
					))}
			</ul>
		</div>
	);
};
