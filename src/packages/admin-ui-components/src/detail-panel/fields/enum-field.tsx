import { useField } from 'formik';
import { useEffect } from 'react';
import { SelectOption, Select, SelectMode } from '../../multi-select';
import { Enum } from '../../utils';

export const EnumField = ({
	name,
	typeEnum,
	multiple,
}: {
	name: string;
	typeEnum: Enum;
	multiple?: boolean;
}) => {
	const [_, meta, helpers] = useField({ name, multiple });
	const { initialValue } = meta;

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const handleOnChange = (selected: SelectOption[]) => {
		if (multiple) {
			return helpers.setValue(selected.map((option) => option.value));
		}
		const value = selected?.[0]?.value;
		return helpers.setValue(value);
	};

	const enumOptions = Array.from(typeEnum.values).map((v) => ({
		label: v.name,
		value: v.value,
	}));

	return (
		<Select
			options={enumOptions}
			value={[].concat(
				(initialValue &&
					(Array.isArray(initialValue)
						? initialValue.map((val) => ({ value: val, label: `${val}` }))
						: { value: initialValue, label: `${initialValue}` })) ||
					[]
			)}
			onChange={handleOnChange}
			mode={multiple ? SelectMode.MULTI : SelectMode.SINGLE}
		/>
	);
};
