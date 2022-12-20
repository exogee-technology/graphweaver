import React, { useMemo } from 'react';
import ReactSelect, { ActionMeta, SingleValue } from 'react-select';

const myOptions: SelectOption[] = [
	{ value: 'chocolate', label: 'Chocolate' },
	{ value: 'strawberry', label: 'Strawberry' },
	{ value: 'vanilla', label: 'Vanilla' },
];

export const MySelect = () => <Select options={myOptions} />;

export interface SelectOption {
	value: any;
	label: string;
}

// A Single-valued Select component
export const Select = ({
	options,
	onChange,
	autoFocus,
	defaultValue,
	isDisabled,
	isClearable,
	placeholder,
	clearSelection,
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
}) => {
	/// TODO: move these styles into a CSS Modules file and reference from there.
	/// TODO: This is not trivial; see https://react-select.com/styles
	const defaultStyles = {
		option: (provided: any, state: { isSelected: boolean; isFocused: boolean }) => ({
			...provided,
			// #12170d is the inverse of var(--body-copy-color) which is RGBA(237,232,242,0.02) but with 100% opacity
			color: state.isSelected ? 'var(--primary-color)' : 'var(--body-copy-color)',
			backgroundColor: state.isSelected
				? '#12170d'
				: state.isFocused
				? 'var(--primary-color)'
				: '#12170d',
		}),
		control: (provided: any, state: { isFocused: boolean }) => ({
			...provided,
			boxSizing: 'border-box',
			borderColor: state.isFocused || 'rgba(237, 232, 242, 0.1)',
			background: 'rgba(237, 232, 242, 0.02)',
			borderRadius: '6px',
			maxWidth: '40%',
			outline: state.isFocused && 'none',
			padding: '0px',
		}),
		menu: (styles: any) => ({
			...styles,
			zIndex: 999,
			fontSize: '12px',
			lineHeight: '20px',
			fontFamily: 'Inter',
			fontWeight: '500',
			fontStyle: 'normal',
			background: 'rgba(237, 232, 242, 0.02)',
			borderRadius: '6px',
			borderColor: 'rgba(237, 232, 242, 0.1)',
			display: 'inline-block',
		}),
		singleValue: (base: any) => ({
			...base,
			padding: 5,
			borderRadius: 5,
			background: 'rgba(237, 232, 242, 0.02)',
			color: '#ede8f2',
			display: 'flex',
		}),
	};

	const change = (option: SingleValue<SelectOption>, action: ActionMeta<SelectOption>) => {
		if (onChange) {
			if (option) {
				onChange(option as SelectOption);
			} else if (clearSelection && action.action === 'clear') {
				onChange();
			}
		}
	};

	// const styles = defaultStyles;

	return (
		<ReactSelect
			styles={defaultStyles}
			options={options}
			onChange={change}
			autoFocus={autoFocus}
			defaultValue={defaultValue}
			menuPlacement={'auto'}
			menuPosition={'fixed'}
			isDisabled={isDisabled}
			isClearable={isClearable}
		/>
	);
};
