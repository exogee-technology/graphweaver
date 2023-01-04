import classNames from 'classnames';
import ReactSelect, { ActionMeta, SingleValue } from 'react-select';

import styles from './styles.module.css';

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
	// See https://react-select.com/styles
	// Also see https://github.com/JedWatson/react-select/blob/master/storybook/stories/ClassNamesWithTailwind.stories.tsx
	// This isn't working because the default styles are written in last (by the loader?) and override these styles. Not worked out
	// how to turn them off. Even with the 'unstyled' option.
	const defaultStyles = {
		menu: () => classNames(styles.reactSelect__menu),
		singleValue: () => classNames(styles.reactSelect__singleValue),
		control: (state: { isFocused: boolean }) =>
			classNames(
				styles.reactSelect__control,
				state.isFocused && styles.reactSelect__controlFocused
			),
		option: (state: { isSelected: boolean; isFocused: boolean }) =>
			classNames(
				state.isSelected && styles.reactSelect__optionSelected,
				state.isFocused && styles.reactSelect__optionFocused,
				!state.isSelected && !state.isFocused && styles.reactSelect__option
			),
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

	return (
		<ReactSelect
			// This is really not ideal but it's hard to override default styles otherwise, and there are other problems; see above
			// See https://react-select.com/styles#the-classnames-prop
			unstyled
			classNames={defaultStyles}
			options={options}
			onChange={change}
			autoFocus={autoFocus}
			defaultValue={defaultValue}
			menuPlacement={'auto'}
			menuPosition={'fixed'}
			isDisabled={isDisabled}
			isClearable={isClearable}
			classNamePrefix={'reactSelect'}
		/>
	);
};
