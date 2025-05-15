import { Checkbox } from '../checkbox';
import { AnyFieldApi, DeepKeys, useForm } from '@tanstack/react-form';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { z } from 'zod';
import { Input } from '../input/component';
import { Col, Grid } from '../layouts';
import { SelectMode, SelectOption } from '../select';
import { Select } from '../select/component';
import { Switch } from '../switch/component';
import styles from './styles.module.css';

/**
 * Field information component that displays validation errors and validation status
 *
 * @param field - The field API from TanStack Form
 */
export const FieldInfo = memo(({ field }: { field: AnyFieldApi }) => {
	return (
		<>
			{field.state.meta.isTouched && !field.state.meta.isValid ? (
				<div className={styles.errorText}>{field.state.meta.errors.join(', ')}</div>
			) : null}
			{field.state.meta.isValidating ? (
				<div className={styles.validatingText}>Validating...</div>
			) : null}
		</>
	);
});

FieldInfo.displayName = 'FieldInfo';

/**
 * Creates a form with built-in validation, field components, and submission handling.
 *
 * @template T - The type of form values (must be a record with string keys)
 * @param props - Configuration options for the form
 * @param props.defaultValues - Initial values for the form fields
 * @param props.zodSchema - Optional Zod schema for validation
 * @param props.onSubmit - Function called with validated data on successful submission
 * @param props.onError - Optional function to handle validation errors
 * @param props.cols - Number of columns in the form grid layout (default: 1)
 * @returns Form components and utilities
 *
 * @example
 * ```tsx
 * // Create a form with validation
 * const { Form, Field, canSubmit } = createForm({
 *   defaultValues: { name: '', email: '', age: 0 },
 *   zodSchema: z.object({
 *     name: z.string().min(2),
 *     email: z.string().email(),
 *     age: z.number().min(18)
 *   }),
 *   onSubmit: (values) => console.log(values),
 *   cols: 2
 * });
 *
 * // Use the form in your component
 * return (
 *   <Form>
 *     <Field name="name" type="text" label="Name" />
 *     <Field name="email" type="text" label="Email" span={2} />
 *     <Field name="age" type="number" label="Age" min={0} max={120} />
 *     <button type="submit" disabled={!canSubmit}>Submit</button>
 *   </Form>
 * );
 * ```
 */
export const createForm = <T extends Record<string, any>>(props: {
	/** Initial values for the form fields */
	defaultValues: T;
	/** Optional Zod schema for validation */
	zodSchema?: z.ZodSchema<T>;
	/** Function called with validated data on successful submission */
	onSubmit: (value: T) => any;
	/** Optional function to handle validation errors */
	onError?: (error: any) => void;
	/** Number of columns in the form grid layout (default: 1) */
	cols?: number;
}) => {
	const { defaultValues, zodSchema, onSubmit, onError, cols = 1 } = props;
	const [canSubmit, setCanSubmit] = useState(false);

	// Create validators based on Zod schema if provided (memoized to prevent rerenders)
	const validators = useMemo(() => {
		if (!zodSchema) return undefined;

		return {
			onSubmit: ({ value }: { value: T }) => {
				try {
					zodSchema.parse(value);
					return undefined; // No errors
				} catch (error) {
					if (error instanceof z.ZodError) {
						// Return an object with field-specific errors
						const fieldErrors: Record<string, string> = {};

						error.errors.forEach((err) => {
							const fieldPath = String(err.path[0]);
							fieldErrors[fieldPath] = err.message;
						});

						return { fields: fieldErrors };
					}

					// Handle other types of errors
					if (onError) onError(error);
					return 'An unexpected error occurred';
				}
			},
		};
	}, [zodSchema, onError]);

	// Create the form instance
	const form = useForm({
		defaultValues,
		validators,
		listeners: {
			onChange: ({ formApi }) => {
				setCanSubmit(formApi.state.isValid);
			},
			onChangeDebounceMs: 300, // Slightly reduced for better performance
		},
		onSubmit: async ({ value }) => {
			try {
				// If we have a schema, we know the data is valid by now
				const validated = zodSchema ? zodSchema.parse(value) : value;
				return onSubmit(validated);
			} catch (error) {
				// This should rarely happen since we validate in the validator
				if (onError) onError(error);
			}
		},
	});

	/**
	 * Helper function to find matching option for a value
	 * @param value - The current field value
	 * @param options - Available options
	 * @returns The matching option or undefined
	 */
	const findMatchingOption = (value: any, options: SelectOption[]): SelectOption | undefined => {
		if (value === undefined || value === null) {
			return undefined;
		}

		// Try to find an exact match first
		let option = options.find((opt) => opt.value === value);

		// If no direct match and comparing objects or strings
		if (!option) {
			if (typeof value === 'object' && value !== null) {
				// For objects, try string comparison
				option = options.find(
					(opt) =>
						JSON.stringify(opt.value) === JSON.stringify(value) ||
						String(opt.value) === String(value)
				);
			}
		}

		return option;
	};

	/**
	 * Field component for rendering form inputs with labels and validation
	 *
	 * @param props - Field configuration
	 * @param props.name - Name/path of the field in the form data
	 * @param props.type - Input type (text, number, select, switch, checkbox)
	 * @param props.label - Optional label for the field
	 * @param props.placeholder - Optional placeholder text
	 * @param props.validation - Optional custom validation function
	 * @param props.span - Column span in grid layout (default: 1)
	 * @param props.min - Minimum value for number inputs
	 * @param props.max - Maximum value for number inputs
	 * @param props.options - Options for select inputs
	 * @param props.mode - Selection mode for select inputs
	 */
	const Field = memo(
		({
			name,
			type,
			label,
			placeholder,
			validation,
			span = 1,
			min = 0,
			max = undefined,
			options = [],
			mode = SelectMode.SINGLE,
		}: {
			name: DeepKeys<T>;
			type: 'text' | 'number' | 'select' | 'switch' | 'checkbox';
			label?: string;
			placeholder?: string;
			validation?: (params: { value: any; fieldApi: AnyFieldApi }) => string | undefined;
			span?: number;
			min?: number;
			max?: number;
			options?: SelectOption[];
			mode?: SelectMode;
		}) => {
			// Create memoized validation function to prevent unnecessary rerenders
			const validationFn = validation ? useCallback(validation, [validation]) : undefined;

			// Create a stable reference to options to prevent rerenders when options are passed inline
			const stableOptions = useMemo(
				() => options,
				[
					// Using the length of options and a simple hash of values for more efficient dependency checking
					options.length,
					options.map((o) => String(o.value)).join(','),
				]
			);

			return (
				<Col span={span}>
					<form.Field
						name={name}
						validators={{
							onChange: validationFn,
						}}
					>
						{(field) => {
							// Get the current value for reference
							const currentValue = field.state.value;

							// Convert field value to string for text inputs
							const stringValue =
								currentValue === null || currentValue === undefined ? '' : String(currentValue);

							return (
								<div className={styles.formField}>
									{label && (
										<label htmlFor={field.name} className={styles.label}>
											{label}
										</label>
									)}

									{/* Render the appropriate input based on type */}
									{type === 'text' && (
										<Input
											name={field.name}
											type="text"
											placeholder={placeholder}
											onChange={(val: string) => {
												field.handleChange(val as any);
											}}
											value={stringValue}
										/>
									)}

									{type === 'number' && (
										<Input
											name={field.name}
											type="number"
											placeholder={placeholder}
											onChange={(val: string) => {
												// Convert empty string to undefined or 0, otherwise to number
												if (val === '') {
													// Default to 0 for numeric fields when empty - more predictable
													field.handleChange(0 as any);
												} else {
													const numValue = Number(val);
													if (!isNaN(numValue)) {
														field.handleChange(numValue as any);
													}
												}
											}}
											value={stringValue}
											min={min}
											max={max}
											onBlur={() => {
												// Ensure numeric value on blur
												if (
													currentValue === undefined ||
													currentValue === null ||
													currentValue === '' ||
													isNaN(Number(currentValue))
												) {
													// Default to 0 or the original default value
													const defaultVal =
														typeof defaultValues[name as keyof T] === 'number'
															? defaultValues[name as keyof T]
															: 0;
													field.handleChange(defaultVal as any);
												}
											}}
										/>
									)}

									{type === 'select' && (
										<Select
											placeholder={placeholder}
											options={stableOptions}
											mode={mode}
											onChange={(selected: SelectOption[]) => {
												// Always convert empty selections to undefined for form state
												if (selected.length === 0) {
													field.handleChange(null as any);
													return;
												}
												if (mode === SelectMode.MULTI) {
													// For multi-select, extract just the values (not the whole option objects)
													const values = selected.map((s) => s.value);
													// Always ensure we're passing an array for multi-select
													const valueToUpdate = values.length > 0 ? values : [];
													field.handleChange(valueToUpdate as any);
												} else if (selected.length > 0) {
													// For single-select, take just the value of the first selected option
													const selectedValue = selected[0].value;
													field.handleChange(selectedValue as any);
												}
											}}
											value={(() => {
												// Pre-compute the value outside of useMemo to avoid hook rules violation
												if (mode === SelectMode.MULTI) {
													if (Array.isArray(currentValue)) {
														return currentValue.map((val: any) => {
															const foundOpt = findMatchingOption(val, stableOptions);
															return foundOpt || { value: val, label: String(val) };
														});
													}
													return [];
												} else {
													const foundOpt = findMatchingOption(currentValue, stableOptions);
													if (foundOpt) return foundOpt;
													return currentValue !== undefined && currentValue !== null
														? { value: currentValue, label: String(currentValue) }
														: undefined;
												}
											})()}
										/>
									)}

									{type === 'switch' && (
										<Switch
											name={field.name}
											onChange={(val: any) => {
												field.handleChange(!!val as any);
											}}
											checked={!!currentValue}
										/>
									)}

									{type === 'checkbox' && (
										<Checkbox
											name={field.name}
											onChange={(val: any) => {
												field.handleChange(!!val as any);
											}}
											checked={!!currentValue}
										/>
									)}

									<FieldInfo field={field} />
								</div>
							);
						}}
					</form.Field>
				</Col>
			);
		}
	);

	Field.displayName = 'FormField';

	/**
	 * Container component that provides form submission handling and layout
	 *
	 * @param props - Form props
	 * @param props.children - React children to render inside the form
	 */
	const Form = memo(({ children }: { children: React.ReactNode }) => {
		const handleSubmit = useCallback(
			(e: React.FormEvent) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			},
			[form]
		);

		return (
			<form onSubmit={handleSubmit}>
				<Grid cols={cols}>{children}</Grid>
			</form>
		);
	});

	Form.displayName = 'Form';

	return {
		/** Field component for rendering form inputs */
		Field,
		/** Form container component */
		Form,
		/** Underlying form instance for advanced usage */
		instance: form,
		/** Boolean indicating if the form can be submitted */
		canSubmit,
		/** Reset the form to its default values */
		reset: form.reset,
		/** Get the current form values */
		getValues: () => form.state.values,
		/** Set a specific field's value programmatically */
		setValue: form.setFieldValue,
	};
};
