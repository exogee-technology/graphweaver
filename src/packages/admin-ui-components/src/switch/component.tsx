import { ChangeEvent, forwardRef, InputHTMLAttributes } from 'react';
import styles from './styles.module.css';

/**
 * Props for the Switch component.
 * Extends HTML input attributes but removes the 'type' and 'onChange' properties
 * to provide a more specific API for the toggle switch.
 */
export interface SwitchProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
	/** Optional text label displayed next to the switch */
	label?: string;
	/** Controls the checked state when using the component as a controlled component */
	checked?: boolean;
	/** Sets the initial checked state when using as an uncontrolled component */
	defaultChecked?: boolean;
	/** Callback fired when the switch state changes, receives the new checked state */
	onChange?: (checked: boolean) => void;
}

/**
 * A toggle switch component that provides an alternative to checkboxes.
 *
 * This component can be used as both a controlled and uncontrolled component,
 * supports keyboard navigation, and can be used in forms.
 *
 * @example
 * // Basic usage
 * <Switch label="Enable feature" />
 *
 * @example
 * // Controlled component
 * <Switch
 *   checked={isEnabled}
 *   onChange={(checked) => setIsEnabled(checked)}
 *   label="Dark mode"
 * />
 *
 * @example
 * // In a form
 * <form onSubmit={handleSubmit}>
 *   <Switch name="enableFeature" ref={switchRef} />
 *   <button type="submit">Save</button>
 * </form>
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
	({ label, checked, defaultChecked, onChange, disabled, className, id, name, ...rest }, ref) => {
		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			onChange?.(event.target.checked);
		};

		return (
			<label className={`${styles.switchContainer} ${className || ''}`}>
				{label && <span className={styles.label}>{label}</span>}
				<div className={styles.switchWrapper}>
					<input
						type="checkbox"
						ref={ref}
						id={id}
						name={name}
						checked={checked}
						defaultChecked={defaultChecked}
						onChange={handleChange}
						disabled={disabled}
						className={styles.switchInput}
						{...rest}
					/>
					<span className={`${styles.switchSlider} ${disabled ? styles.disabled : ''}`} />
				</div>
			</label>
		);
	}
);

// Provide a display name for better debugging experience
Switch.displayName = 'Switch';
