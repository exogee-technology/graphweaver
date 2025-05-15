import clsx from 'clsx';
import {
	ChangeEvent,
	memo,
	MouseEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react';
import styles from './styles.module.css';

/**
 * Defines the selection mode for the Select component.
 * @enum {string}
 */
export enum SelectMode {
	/** Allow only one item to be selected */
	SINGLE = 'SINGLE',
	/** Allow multiple items to be selected */
	MULTI = 'MULTI',
}

/**
 * Represents an option in the Select component.
 * @interface SelectOption
 */
export interface SelectOption {
	/** Unique identifier for the option */
	value: unknown;
	/** Display text for the option */
	label?: string;
}

/**
 * Props for the Select component.
 * @interface SelectProps
 */
interface SelectProps {
	/** Array of options to display in the dropdown */
	options: SelectOption[];
	/** Callback fired when selection changes */
	onChange: (selected: SelectOption[]) => void;
	/** Selection mode: single or multiple */
	mode: SelectMode;
	/** Callback fired when dropdown opens */
	onOpen?: () => void;
	/** Currently selected value(s) */
	value?: SelectOption | SelectOption[];
	/** Text to display when no option is selected */
	placeholder?: string;
	/** Whether the dropdown is in loading state */
	loading?: boolean;
	/** Whether the select should be focused on mount */
	autoFocus?: boolean;
	/** Whether the select is disabled */
	disabled?: boolean;
	/** Test ID for component testing */
	['data-testid']?: string;
	/** Label for the select element */
	label?: string;
	/** Whether the select is required */
	required?: boolean;
	/** CSS class name */
	className?: string;
}

/**
 * Converts a value to an array if it isn't already.
 * @template T - The type of the value
 * @param {T} value - The value to convert
 * @returns {Array} - The value as an array
 */
function arrayify<T>(value: T): any[] {
	if (Array.isArray(value)) return value;
	if (value !== null && value !== undefined) return [value];
	return [];
}

/**
 * Option item component for the dropdown
 */
const OptionItem = memo(
	({
		option,
		isSelected,
		onSelect,
	}: {
		option: SelectOption;
		isSelected: boolean;
		onSelect: (option: SelectOption, e: MouseEvent) => void;
	}) => (
		<div
			className={clsx(styles.option, isSelected && styles.selected)}
			onClick={(e) => onSelect(option, e)}
			role="option"
			aria-selected={isSelected}
		>
			{option.label}
		</div>
	)
);

OptionItem.displayName = 'OptionItem';

/**
 * A hybrid select component that uses native select for accessibility with custom styling.
 *
 * @param {SelectProps} props - The component props
 * @returns {JSX.Element} The rendered component
 */
export const Select = ({
	options,
	onChange,
	onOpen,
	mode,
	value = [],
	placeholder = 'Select',
	loading = false,
	autoFocus = false,
	disabled = false,
	['data-testid']: testId,
	label,
	required = false,
	className,
}: SelectProps): JSX.Element => {
	const id = useId();
	const selectRef = useRef<HTMLSelectElement>(null);
	const selectWrapperRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Simplify value handling - only tracking what we need
	const valueArray = arrayify(value);
	const selectedValueStrings = valueArray.map((option) => String(option.value));

	// For native select - always use strings
	const selectValue =
		mode === SelectMode.MULTI
			? selectedValueStrings
			: selectedValueStrings.length > 0
				? selectedValueStrings[0]
				: '';

	// For display purposes
	const displayText =
		valueArray.length === 0
			? '' // Empty for placeholder to appear via CSS
			: valueArray.length === 1
				? (valueArray[0].label ?? String(valueArray[0].value))
				: `${valueArray.length} Selected`;

	// Handle option clicks in custom dropdown
	const handleOptionClick = useCallback(
		(option: SelectOption, e: MouseEvent) => {
			e.stopPropagation();

			// Debug the clicked option to trace issues with specific values
			console.log('Option clicked:', {
				value: option.value,
				stringValue: String(option.value),
				label: option.label,
				type: typeof option.value,
			});

			let newSelected: SelectOption[];

			if (mode === SelectMode.MULTI) {
				// Find if already selected - use normalized string comparison
				const optionStrValue = String(option.value).trim();
				// Log the comparison being made
				const isSelected = valueArray.some((item) => {
					const itemStrValue = String(item.value).trim();
					const matches = itemStrValue === optionStrValue;
					console.log('Comparing values:', { itemStrValue, optionStrValue, matches });
					return matches;
				});

				if (isSelected) {
					// Remove - also use normalized comparison
					newSelected = valueArray.filter((item) => String(item.value).trim() !== optionStrValue);
				} else {
					// Add
					newSelected = [...valueArray, option];
				}
			} else {
				// Single select - just replace
				newSelected = [option];
				setTimeout(() => setIsOpen(false), 50);
			}

			// Debug what we're sending up
			console.log(
				'Sending new selection:',
				newSelected.map((opt) => ({
					value: opt.value,
					stringValue: String(opt.value),
					label: opt.label,
				}))
			);

			onChange(newSelected);
		},
		[mode, valueArray, onChange]
	);

	// Basic change handler for native select
	const handleChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const selectedItems: SelectOption[] = [];

			// Log all selected options for debugging
			console.log('Native select changed:', {
				selectedOptions: Array.from(e.target.selectedOptions).map((o) => o.value),
				currentValue: value,
			});

			// Get all selected option elements from the DOM
			for (let i = 0; i < e.target.selectedOptions.length; i++) {
				const optionEl = e.target.selectedOptions[i];
				// Find the matching option from our options array using normalized comparison
				const optionValue = optionEl.value.trim();

				// Try direct match first, then trimmed/normalized match
				let option = options.find((opt) => String(opt.value) === optionValue);

				// If no match, try more lenient comparison with trimming and normalization
				if (!option) {
					option = options.find((opt) => String(opt.value).trim() === optionValue);
				}

				if (option) {
					selectedItems.push(option);
				} else {
					console.warn(`Could not find matching option for value: "${optionValue}"`);
				}
			}

			// Always call onChange with the full option objects
			onChange(selectedItems);

			// Auto close in single select mode
			if (mode === SelectMode.SINGLE) {
				setIsOpen(false);
			}
		},
		[options, onChange, mode, value]
	);

	// Handle focus/blur
	const handleFocus = useCallback(() => {
		setIsFocused(true);
		setIsOpen(true);
		if (onOpen) onOpen();
	}, [onOpen]);

	const handleBlur = useCallback(() => {
		// Delay the blur action to avoid conflicts with click events
		setTimeout(() => {
			const activeEl = document.activeElement;
			const isInsideComponent =
				dropdownRef.current?.contains(activeEl as Node) ||
				selectWrapperRef.current?.contains(activeEl as Node);

			if (!isInsideComponent && isOpen) {
				setIsFocused(false);
				setIsOpen(false);
			}
		}, 100);
	}, [isOpen]);

	// Toggle dropdown
	const toggleDropdown = useCallback(
		(e?: MouseEvent) => {
			if (disabled || loading) return;
			e?.stopPropagation();

			const newIsOpen = !isOpen;
			setIsOpen(newIsOpen);

			if (newIsOpen) {
				selectRef.current?.focus();
				if (onOpen) onOpen();
			}
		},
		[disabled, loading, isOpen, onOpen]
	);

	// Outside click handler
	useEffect(() => {
		if (!isOpen) return undefined;

		const handleClickOutside = (e: globalThis.MouseEvent) => {
			if (
				!dropdownRef.current?.contains(e.target as Node) &&
				!selectWrapperRef.current?.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	// Auto focus if needed
	useEffect(() => {
		if (autoFocus && selectRef.current) {
			selectRef.current.focus();
		}
	}, [autoFocus]);

	// Check if an option is selected (for custom dropdown)
	const isOptionSelected = useCallback(
		(optionValue: unknown) => {
			// Normalize the string value
			const normalizedValue = String(optionValue).trim();

			// Use normalized comparison
			return valueArray.some((item) => {
				return String(item.value).trim() === normalizedValue;
			});
		},
		[valueArray]
	);

	return (
		<div
			className={clsx(
				styles.container,
				className,
				isFocused && styles.focused,
				isOpen && styles.open
			)}
		>
			{label && (
				<label htmlFor={id} className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</label>
			)}
			<div className={styles.selectWrapper} ref={selectWrapperRef}>
				{/* Custom display */}
				<div
					className={clsx(styles.customSelect, disabled && styles.disabled)}
					onClick={(e) => toggleDropdown(e as any)}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
				>
					<div className={styles.displayText} data-placeholder={placeholder}>
						{displayText}
					</div>
					<div className={clsx(styles.arrow, isOpen && styles.open)}>
						<svg width="12" height="12" fill="#e0dde5" viewBox="0 0 16 16">
							<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
						</svg>
					</div>
				</div>

				{/* Native select element - keep this simple */}
				<select
					id={id}
					ref={selectRef}
					data-testid={testId}
					className={styles.nativeSelect}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					disabled={disabled || loading}
					multiple={mode === SelectMode.MULTI}
					required={required}
					value={selectValue}
					aria-label={label || placeholder}
				>
					{/* Empty option for placeholder */}
					{(!selectedValueStrings.length || mode === SelectMode.MULTI) && placeholder && (
						<option value="" disabled={required}>
							{placeholder}
						</option>
					)}
					{/* Map all options */}
					{options.map((option) => (
						<option
							key={String(option.value)}
							value={String(option.value)}
							data-original-value={option.value}
						>
							{option.label || String(option.value)}
						</option>
					))}
				</select>

				{/* Custom dropdown */}
				{isOpen && (
					<div
						className={styles.dropdown}
						ref={dropdownRef}
						role="listbox"
						aria-multiselectable={mode === SelectMode.MULTI}
					>
						{loading ? (
							<div className={styles.loadingItem}>Loading...</div>
						) : options.length > 0 ? (
							options.map((option) => (
								<OptionItem
									key={`dropdown-${String(option.value)}`}
									option={option}
									isSelected={isOptionSelected(option.value)}
									onSelect={handleOptionClick}
								/>
							))
						) : (
							<div className={styles.emptyOption}>No options available</div>
						)}
					</div>
				)}

				{loading && <div className={styles.loadingIndicator}>Loading...</div>}
			</div>
		</div>
	);
};
