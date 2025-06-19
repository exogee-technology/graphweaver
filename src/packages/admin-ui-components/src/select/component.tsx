import clsx from 'clsx';
import { JSX, memo, MouseEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import styles from './styles.module.css';

/**
 * Defines the selection mode for the Select component.
 */
export enum SelectMode {
	/** Single selection mode - only one option can be selected at a time */
	SINGLE = 'SINGLE',
	/** Multi selection mode - multiple options can be selected simultaneously */
	MULTI = 'MULTI',
}

/**
 * Represents an option in the Select component.
 */
export interface SelectOption {
	/** The actual value of the option that will be used in form data */
	value: unknown;
	/** The display text for the option. If not provided, the value will be stringified and used */
	label?: string;
}

/**
 * Props for the Select component.
 */
interface SelectProps {
	/** Array of available options to choose from */
	options: SelectOption[];
	/** Callback function called when the selection changes */
	onChange: (selected: SelectOption[]) => void;
	/** Selection mode - single or multi selection */
	mode: SelectMode;
	/** Optional callback triggered when the dropdown opens (useful for lazy loading) */
	onOpen?: () => void;
	/** Currently selected value(s). Can be a single option or array of options */
	value?: SelectOption | SelectOption[];
	/** Placeholder text shown when no option is selected */
	placeholder?: string;
	/** Whether the select is in a loading state */
	loading?: boolean;
	/** Whether the select is disabled */
	disabled?: boolean;
	/** Test ID for automated testing */
	['data-testid']?: string;
	/** Optional label displayed above the select */
	label?: string;
	/** Whether the field is required (shows asterisk in label) */
	required?: boolean;
	/** Additional CSS class name for styling */
	className?: string;
}

/**
 * Utility function to normalize value prop into an array format.
 * @param value - The value to convert, can be undefined, single option, or array of options
 * @returns Array of SelectOption objects
 */
function arrayify(value: SelectOption | SelectOption[] | undefined): SelectOption[] {
	if (Array.isArray(value)) return value;
	if (value != null) return [value];
	return [];
}

/**
 * Individual option item component rendered within the dropdown.
 * Memoized for performance optimization.
 */
const OptionItem = memo(
	({
		option,
		isSelected,
		onSelect,
	}: {
		/** The option data to render */
		option: SelectOption;
		/** Whether this option is currently selected */
		isSelected: boolean;
		/** Callback when this option is clicked */
		onSelect: (o: SelectOption, e: MouseEvent) => void;
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
 * A customizable Select component that supports both single and multi-selection modes.
 *
 * Features:
 * - Single and multi-selection modes
 * - Keyboard navigation support
 * - Loading states
 * - Disabled state
 * - Custom placeholder text
 * - Optional labels with required indicators
 * - Accessible with proper ARIA attributes
 * - Click outside to close functionality
 *
 * @example
 * // Single selection
 * <Select
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' }
 *   ]}
 *   mode={SelectMode.SINGLE}
 *   onChange={(selected) => console.log(selected)}
 *   placeholder="Choose an option"
 * />
 *
 * @example
 * // Multi selection with label
 * <Select
 *   options={options}
 *   mode={SelectMode.MULTI}
 *   onChange={(selected) => setSelectedOptions(selected)}
 *   value={selectedOptions}
 *   label="Select multiple options"
 *   required
 * />
 *
 * @param props - The component props
 * @returns The rendered Select component
 */
export const Select = ({
	options,
	onChange,
	onOpen,
	mode,
	value,
	placeholder = 'Select',
	loading = false,
	disabled = false,
	['data-testid']: testId,
	label,
	required = false,
	className,
}: SelectProps): JSX.Element => {
	const id = useId();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const valueArray = arrayify(value);

	const displayText =
		valueArray.length === 0
			? ''
			: valueArray.length === 1
				? (valueArray[0].label ?? String(valueArray[0].value))
				: `${valueArray.length} Selected`;

	const handleOptionClick = useCallback(
		(option: SelectOption, e: MouseEvent) => {
			e.stopPropagation();
			let newSelected: SelectOption[];
			if (mode === SelectMode.MULTI) {
				const exists = valueArray.some((item) => {
					// Use simple comparison for primitive values
					return item.value === option.value;
				});
				newSelected = exists
					? valueArray.filter((item) => item.value !== option.value)
					: [...valueArray, option];
			} else {
				newSelected = [option];
				setIsOpen(false);
			}
			onChange(newSelected);
		},
		[mode, valueArray, onChange]
	);

	const toggleDropdown = useCallback(
		(e?: MouseEvent) => {
			if (disabled || loading) return;
			e?.stopPropagation();
			const next = !isOpen;
			setIsOpen(next);
			if (next) {
				onOpen?.();
			}
		},
		[disabled, loading, isOpen, onOpen]
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (disabled || loading) return;

			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggleDropdown();
			} else if (e.key === 'Escape' && isOpen) {
				setIsOpen(false);
			}
		},
		[disabled, loading, isOpen, toggleDropdown]
	);

	useEffect(() => {
		if (!isOpen) return;
		const onClickOutside = (e: Event) => {
			if (
				!dropdownRef.current?.contains(e.target as Node) &&
				!wrapperRef.current?.contains(e.target as Node)
			) {
				setIsOpen(false);
				setIsFocused(false);
			}
		};
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, [isOpen]);

	const isOptionSelected = useCallback(
		(val: unknown) => valueArray.some((item) => item.value === val),
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
			<div className={styles.selectWrapper} ref={wrapperRef}>
				<div
					className={clsx(styles.customSelect, disabled && styles.disabled)}
					onClick={toggleDropdown}
					onKeyDown={handleKeyDown}
					tabIndex={disabled ? -1 : 0}
					role="button"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-labelledby={label ? `${id}-label` : undefined}
					data-testid={testId}
				>
					<div className={styles.displayText} data-placeholder={placeholder}>
						{displayText || placeholder}
					</div>
					<div className={clsx(styles.arrow, isOpen && styles.open)}>
						<svg width="12" height="12" fill="#e0dde5" viewBox="0 0 16 16">
							<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
						</svg>
					</div>
				</div>

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
							options.map((option, index) => (
								<OptionItem
									key={`${String(option.value)}-${index}`}
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
