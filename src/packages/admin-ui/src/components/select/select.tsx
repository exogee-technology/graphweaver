import React, { useMemo } from 'react';
import ReactSelect, { ActionMeta, SingleValue } from 'react-select';

import styles from './styles.module.css';

const options: SelectOption[] = [
	{ value: 'chocolate', label: 'Chocolate' },
	{ value: 'strawberry', label: 'Strawberry' },
	{ value: 'vanilla', label: 'Vanilla' },
];

export const MySelect = () => <Select options={options} />;

export interface SelectOption {
	value: any;
	label: string;
}

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
	// const isFocusedRef = useRef(false)

	const defaultStyles =
		//useMemo( () => (
		{
			option: (provided: any, state: { isSelected: boolean; isFocused: boolean }) => ({
				...provided,
				// #ede8f2 is RGBA(237,232,242,0.02) but with 100% opacity
				// #12170d is the inverse
				color: state.isSelected ? 'var(--primary-color)' : '#EDE8F2',
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
				// color: "#EDE8F2",
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
				color: '#EDE8F2',
				display: 'flex',
			}),
			// /// Code to make container expand to fit content: see https://github.com/JedWatson/react-select/issues/3603
			// /// and https://codesandbox.io/s/react-select-v3-autosize-d3j92?fontsize=14&hidenavigation=1&theme=dark&file=/src/App.js:1181-1517
			// /// Code also uses  const isFocusedRef = useRef(false); and wraps the lot in an anonymous arrow func wrapped with useMemo()
			//   container: (base, state) => {
			//       isFocusedRef.current = state.isFocused;
			//       return {
			//           ...base,
			//           display: "inline-block"
			//       };
			//   },
		}; //), [])

	const change = (option: SingleValue<SelectOption>, action: ActionMeta<SelectOption>) => {
		if (onChange) {
			if (option) {
				onChange(option as SelectOption);
			} else if (clearSelection && action.action === 'clear') {
				onChange();
			}
		}
	};

	const styles = defaultStyles;
	// isDisabled
	//    ? {...defaultStyles,
	// //     /// Ensure these components are as styled whwn the MultiSelect
	// //     /// or Select boxes are disabled. See https://react-select.com/components
	//     indicatorsContainer: (
	//         provided: any,
	//         props: {
	//             isDisabled: boolean,
	//             // isLoading: boolean
	//         }) => ({
	//         ...provided,
	//         display: props.isDisabled //&& !props.isLoading
	//             && "none"
	//     }),
	//     control: (
	//         provided: any,
	//         state: {
	//             isDisabled: boolean
	//         }) => ({
	//         ...provided,
	//         border: state.isDisabled && "none",
	//         fontSize: "85%"
	//     })
	//   } : defaultStyles

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
