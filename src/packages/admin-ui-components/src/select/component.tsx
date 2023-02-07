import React from 'react';
import { useCallback, useRef, useState } from 'react';
import ReactSelect, { ActionMeta, GroupBase, SingleValue, SelectInstance } from 'react-select';

import './styles.module.css';

export interface SelectOption {
	value: any;
	label: string;
}

// This gets updated as the component is used - shouldn't be wrapped in useMemo
// @todo: See docs on new classNames prop to consider using classnames...although not sure
// if we can get them to work with CSS Modules name mangling
const defaultStyles = {
	option: (providedStyles: any, state: { isSelected: boolean; isFocused: boolean }) => ({
		...providedStyles,
		// #ede8f2 is RGBA(237,232,242,0.02) but with 100% opacity
		// #12170d is the inverse
		color: state.isSelected ? 'var(--primary-color)' : 'var(--body-copy-color)', // '#EDE8F2',
		backgroundColor: state.isSelected
			? 'var(--select-selected-option-color)'
			: state.isFocused
			? 'var(--primary-color)'
			: 'var(--select-selected-option-color)',
		fontSize: '12px',
	}),
	container: (providedStyles: any) => ({
		...providedStyles,
		flexGrow: '1',
	}),
	placeholder: (providedStyles: any) => ({
		...providedStyles,
		textTransform: 'uppercase',
	}),
	control: (providedStyles: any, state: { isFocused: boolean }) => ({
		...providedStyles,
		boxSizing: 'border-box',
		borderColor: state.isFocused || 'var(--select-border-color)',
		background: 'var(--select-background)',
		borderRadius: '6px',
		outline: state.isFocused && 'none',
		padding: '0px',
	}),
	indicatorSeparator: (providedStyles: any, state: { isFocused: boolean }) => ({
		...providedStyles,
		backgroundColor: state.isFocused || 'var(--select-border-color)',
		// background: 'var(--select-background)',
		// outline: state.isFocused && 'none',
	}),
	menu: (providedStyles: any) => ({
		...providedStyles,
		zIndex: 999,
		fontSize: '12px',
		lineHeight: '20px',
		fontFamily: 'Inter',
		fontWeight: '500',
		fontStyle: 'normal',
		background: 'var(--select-background)',
		borderRadius: '6px',
		borderColor: 'var(--select-border-color)',
		display: 'inline-block',
	}),
	singleValue: (providedStyles: any) => ({
		...providedStyles,
		padding: 5,
		borderRadius: 5,
		// background: 'var(--select-background)',
		background: 'var(--primary-color)',
		color: 'var(--body-copy-color)',
		display: 'flex',
	}),
	// // Code to make container expand to fit content: see https://github.com/JedWatson/react-select/issues/3603
	// // and https://codesandbox.io/s/react-select-v3-autosize-d3j92?fontsize=14&hidenavigation=1&theme=dark&file=/src/App.js:1181-1517
	// // Code also uses  const isFocusedRef = useRef(false); and wraps the lot in an anonymous arrow func wrapped with useMemo()
	//   container: (base, state) => {
	//       isFocusedRef.current = state.isFocused;
	//       return {
	//           ...base,
	//           display: "inline-block"
	//       };
	//   },
}; //), [])

export const clearSelect = (ref: any) => {
	ref.current?.clearValue();
};

/// A Single-valued Select component, wrapped in a forwardRef so we can program clear buttons etc
export const Select = React.forwardRef(
	(
		{
			options,
			onChange,
			autoFocus,
			defaultValue,
			isDisabled,
			isClearable,
			placeholder,
			clearSelection,
			labelPrefix,
		}: {
			options: SelectOption[];
			onChange?: (value?: SelectOption) => void;
			autoFocus?: boolean;
			defaultValue?: SelectOption;
			isDisabled?: boolean;
			isClearable?: boolean;
			placeholder?: string;
			// We are/are not interested when the selection is cleared
			clearSelection?: boolean;
			labelPrefix?: string;
		},
		ref?: any
	) => {
		const change = (option?: SingleValue<SelectOption>, action?: ActionMeta<SelectOption>) => {
			if (onChange === undefined) {
				return;
			}
			if (option) {
				onChange(option as SelectOption);
			} else if (clearSelection && action?.action === 'clear') {
				onChange();
			}
		};

		const styles = defaultStyles;
		const prefix = labelPrefix ? `${labelPrefix}: ` : '';

		return (
			<ReactSelect
				ref={ref}
				styles={styles}
				options={options}
				onChange={change}
				autoFocus={autoFocus}
				defaultValue={defaultValue}
				menuPlacement={'auto'}
				menuPosition={'fixed'}
				placeholder={placeholder}
				isDisabled={isDisabled}
				isClearable={isClearable}
				// @todo: Unfortunately this sticks a prefix on every menu item not just the selected item
				getOptionLabel={(option) => `${prefix}${option.label}`}
			/>
		);
	}
);
