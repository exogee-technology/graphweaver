import { useCallback, useState } from 'react';
import ReactSelect, { ActionMeta, SingleValue } from 'react-select';

import './styles.module.css';

export interface SelectOption {
	value: any;
	label: string;
}

// This gets updated as the component is used - shouldn't be wrapped in useMemo
const defaultStyles = {
	option: (provided: any, state: { isSelected: boolean; isFocused: boolean }) => ({
		...provided,
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
	control: (provided: any, state: { isFocused: boolean }) => ({
		...provided,
		boxSizing: 'border-box',
		borderColor: state.isFocused || 'rgba(237, 232, 242, 0.1)', //@todo: add to main.css as root var
		background: 'var(--select-background)',
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
		background: 'var(--select-background)',
		borderRadius: '6px',
		borderColor: 'var(--select-border-color)',
		display: 'inline-block',
	}),
	singleValue: (base: any) => ({
		...base,
		padding: 5,
		borderRadius: 5,
		background: 'var(--select-background)',
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

/// A Single-valued Select component
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
	// const [selectedOption, setSelectedOption] = useState(defaultValue);

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

	return (
		<ReactSelect
			styles={styles}
			options={options}
			onChange={change}
			autoFocus={autoFocus}
			defaultValue={defaultValue}
			menuPlacement={'auto'}
			menuPosition={'fixed'}
			// placeholder={placeholder}
			isDisabled={isDisabled}
			isClearable={isClearable}
		/>
	);
};
