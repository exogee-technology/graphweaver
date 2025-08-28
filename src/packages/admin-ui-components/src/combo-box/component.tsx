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
	const dropdownRef = useRef<HTMLUListElement>(null);

	// Lazy loading state
	const [dynamicOptions, setDynamicOptions] = useState<SelectOption[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasReachedEnd, setHasReachedEnd] = useState(false);

	// Use ref to track if we're already loading data to prevent duplicate fetches
	const fetchedPagesRef = useRef(new Set<number>());

	// Use dynamic options if dataFetcher is provided, otherwise use static options
	const options = dataFetcher ? dynamicOptions : staticOptions || [];

	const {
		isOpen,
		getMenuProps,
		getInputProps,
		highlightedIndex,
		getItemProps,
		inputValue,
		setInputValue,
		openMenu,
		closeMenu,
		toggleMenu,
	} = useCombobox({
		items: options,
		id: fieldId,
		itemToString: (item) => item?.label ?? '',
		isItemDisabled: () => disabled,
		onInputValueChange: ({ inputValue }) => {
			if (allowFreeTyping && onInputChange && inputValue !== undefined) {
				onInputChange(inputValue);
			}
			// Update search term for lazy loading
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

	// Define fetchData after useCombobox where isOpen is available
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

				if (result && result.length > 0) {
					setDynamicOptions((prev) => [...prev, ...result]);
				} else {
					setHasReachedEnd(true);
				}
			} catch (error) {
				console.error('ComboBox fetchData error:', error);
			} finally {
				setIsLoadingMore(false);
			}
		},
		[dataFetcher, isOpen]
	);

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

	// Position dropdown when opened
	useEffect(() => {
		const positionDropdown = () => {
			if (isOpen && selectBoxRef.current && dropdownRef.current) {
				const selectRect = selectBoxRef.current.getBoundingClientRect();
				const dropdown = dropdownRef.current;

				// Use the absolute viewport position - getBoundingClientRect() already accounts for all scroll positions
				dropdown.style.top = `${selectRect.bottom + 2}px`;
				dropdown.style.left = `${selectRect.left}px`;
				dropdown.style.width = `${Math.max(selectRect.width, 150)}px`;
			}
		};

		const addScrollListeners = () => {
			// Add scroll event listeners to all scrollable parent containers and window
			const scrollListeners: Array<{ element: Element | Window; listener: EventListener }> = [];

			// Listen to window scroll
			const windowListener = positionDropdown;
			window.addEventListener('scroll', windowListener);
			scrollListeners.push({ element: window, listener: windowListener });

			// Listen to parent container scrolls
			let element = selectBoxRef.current?.parentElement;
			while (element && element !== document.body) {
				const computedStyle = window.getComputedStyle(element);
				if (
					computedStyle.overflowX === 'auto' ||
					computedStyle.overflowX === 'scroll' ||
					computedStyle.overflowY === 'auto' ||
					computedStyle.overflowY === 'scroll'
				) {
					const listener = positionDropdown;
					element.addEventListener('scroll', listener);
					scrollListeners.push({ element, listener });
				}
				element = element.parentElement;
			}

			return scrollListeners;
		};

		if (isOpen) {
			positionDropdown();
			const scrollListeners = addScrollListeners();

			// Cleanup function to remove scroll listeners
			return () => {
				scrollListeners.forEach(({ element, listener }) => {
					element.removeEventListener('scroll', listener);
				});
			};
		}
	}, [isOpen]);

	const handleOnPillKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Backspace' || e.key === 'Delete') {
			onChange([]);
			closeMenu();
		}
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
								<button
									type="button"
									className={styles.deleteOption}
									onClick={() => {
										onChange([]);
										closeMenu();
									}}
									aria-label="Clear selection"
								>
									&times;
								</button>
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
									onFocus: openMenu,
									placeholder: valueArray.length === 0 ? placeholder : undefined,
								})}
							/>
						</div>
					)}
				</div>

				<span
					onClick={() => !disabled && toggleMenu()}
					className={clsx(styles.arrow, isOpen && styles.arrowOpen)}
				>
					<ChevronDownIcon />
				</span>
			</div>

			<ul
				ref={dropdownRef}
				className={styles.optionsDropdown}
				{...getMenuProps()}
				onScroll={handleScroll}
			>
				{isOpen &&
					(loading ? (
						<Spinner />
					) : (
						<>
							{options.map((item, index) => (
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
							))}

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
