import { useField } from 'formik';
import { SelectOption, ComboBox, SelectMode } from '../../combo-box';
import { Enum } from '../../utils';

export const EnumField = ({
	name,
	typeEnum,
	multiple,
	autoFocus = false,
	disabled = false,
}: {
	name: string;
	typeEnum: Enum;
	multiple?: boolean;
	autoFocus?: boolean;
	disabled?: boolean;
}) => {
	const [{ value }, _, helpers] = useField({ name, multiple });

	const handleOnChange = (selected: SelectOption[]) => {
		if (multiple) {
			helpers.setValue(selected.map(({ value }) => value));
		} else {
			helpers.setValue(selected?.[0].value);
		}
	};

	// From _graphweaver we get { name, value }. We need { label, value } for the combo box.
	const enumOptions = typeEnum.values.map(({ name, value }) => ({
		label: name,
		value,
	}));

	// The values come in as just the keys of the enum. Like above, we need to map to the
	// full { label, value } object for the combo box.
	const comboBoxValue = Array.isArray(value)
		? value.map((innerValue) => enumOptions.find(({ label }) => label === innerValue))
		: enumOptions.find(({ label }) => label === value);

	// Let's make sure we got values for everything. We should have.
	if (
		(value && !comboBoxValue) ||
		(Array.isArray(comboBoxValue) && value.some((v: SelectOption | undefined) => !v))
	) {
		throw new Error(
			`Could not look up enum values, got ${comboBoxValue}, enum options: ${enumOptions}, value: ${value}. This should not happen.`
		);
	}

	return (
		<ComboBox
			options={enumOptions}
			// We can confidently cast here because of our validation above.
			value={comboBoxValue as SelectOption | SelectOption[]}
			onChange={handleOnChange}
			mode={multiple ? SelectMode.MULTI : SelectMode.SINGLE}
			autoFocus={autoFocus}
			disabled={disabled}
		/>
	);
};
