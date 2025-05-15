import clsx from 'clsx';
import { ChangeEvent, forwardRef, InputHTMLAttributes, useId, useState } from 'react';
import styles from './styles.module.css';

/**
 * Input component props
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	/** Label for the input field */
	label?: string;
	/** Whether the input is required */
	required?: boolean;
	/** Handler for when the input value changes */
	onChange?: (value: string) => void;
	/** Error message to display */
	error?: string;
	/** Whether to show the password toggle button (only for type="password") */
	showPasswordToggle?: boolean;
	/** Additional class name for the input wrapper */
	className?: string;
	/** ID for the input element */
	id?: string;
	/** Minimum value (only for type="number") */
	min?: number;
	/** Maximum value (only for type="number") */
	max?: number;
	/** Step value for increments (only for type="number") */
	step?: number;
	/** Legacy field name property */
	fieldName?: string;
}

/**
 * A reusable input component that supports various input types including
 * text, password, number, email, etc. with consistent styling.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			required = false,
			type = 'text',
			onChange,
			error,
			className,
			id: providedId,
			disabled = false,
			placeholder,
			value,
			defaultValue,
			showPasswordToggle = true,
			min,
			max,
			step = 1,
			name,
			fieldName,
			...rest
		},
		ref
	) => {
		const [highlighted, setHighlighted] = useState(false);
		const [passwordVisible, setPasswordVisible] = useState(false);
		const [internalValue, setInternalValue] = useState<string>(
			value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ''
		);
		const id = providedId || useId();

		// Determine actual input type based on password visibility state
		const actualType = type === 'password' && passwordVisible ? 'text' : type;

		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			const newValue = event.target.value;
			setInternalValue(newValue);
			onChange?.(newValue);
		};

		const handleFocus = () => {
			setHighlighted(true);
		};

		const handleBlur = () => {
			setHighlighted(false);
		};

		const togglePasswordVisibility = () => {
			setPasswordVisible(!passwordVisible);
		};

		// Handle number increment/decrement with min/max boundaries
		const incrementNumber = () => {
			if (disabled) return;

			const currentValue =
				value !== undefined ? Number(value) : internalValue ? Number(internalValue) : 0;
			const stepValue = Number(step) || 1;

			let newValue = currentValue + stepValue;

			// Check if newValue exceeds max
			if (max !== undefined && newValue > max) {
				newValue = max;
			}

			setInternalValue(String(newValue));
			onChange?.(String(newValue));
		};

		const decrementNumber = () => {
			if (disabled) return;

			const currentValue =
				value !== undefined ? Number(value) : internalValue ? Number(internalValue) : 0;
			const stepValue = Number(step) || 1;

			let newValue = currentValue - stepValue;

			// Check if newValue is less than min
			if (min !== undefined && newValue < min) {
				newValue = min;
			}

			setInternalValue(String(newValue));
			onChange?.(String(newValue));
		};

		return (
			<div className={clsx(styles.inputWrapper, className)}>
				{label && (
					<label htmlFor={id} className={styles.label}>
						{label}
						{required && <span className={styles.required}>*</span>}
					</label>
				)}

				<div
					className={clsx(
						styles.input,
						highlighted && styles.inputHighlighted,
						error && styles.inputError
					)}
				>
					<input
						id={id}
						type={actualType}
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholder={placeholder}
						disabled={disabled}
						value={value !== undefined ? value : internalValue}
						min={min}
						max={max}
						step={step}
						ref={ref}
						name={name || fieldName}
						{...rest}
					/>

					{/* Number input buttons */}
					{type === 'number' && (
						<div className={styles.numberControls}>
							<button
								type="button"
								className={styles.numberButton}
								onClick={incrementNumber}
								aria-label="Increment"
								tabIndex={-1}
								disabled={disabled || (max !== undefined && Number(internalValue) >= max)}
							>
								<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
									<path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
								</svg>
							</button>
							<button
								type="button"
								className={styles.numberButton}
								onClick={decrementNumber}
								aria-label="Decrement"
								tabIndex={-1}
								disabled={disabled || (min !== undefined && Number(internalValue) <= min)}
							>
								<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
									<path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
								</svg>
							</button>
						</div>
					)}

					{/* Password visibility toggle */}
					{type === 'password' && showPasswordToggle && (
						<button
							type="button"
							className={styles.passwordToggle}
							onClick={togglePasswordVisibility}
							aria-label={passwordVisible ? 'Hide password' : 'Show password'}
							tabIndex={-1}
						>
							{passwordVisible ? (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
								</svg>
							) : (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
								</svg>
							)}
						</button>
					)}
				</div>

				{error && <div className={styles.errorMessage}>{error}</div>}
			</div>
		);
	}
);

Input.displayName = 'Input';
