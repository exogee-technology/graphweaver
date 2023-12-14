import { useField } from 'formik';
import { useEffect } from 'react';
import { SelectOption, Select, SelectMode } from '../../multi-select';

export const BooleanField = ({ name }: { name: string }) => {
	const [_, meta, helpers] = useField({ name, multiple: false });
	const { initialValue } = meta;

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const handleOnChange = (selected: SelectOption[]) => {
		const value = selected?.[0]?.value;
		if (value === undefined) {
			helpers.setValue(undefined);
		} else {
			helpers.setValue(value);
		}
	};

	return (
		<Select
			options={[
				{ value: true, label: 'true' },
				{ value: false, label: 'false' },
			]}
			value={initialValue === undefined ? [] : [{ value: initialValue, label: `${initialValue}` }]}
			onChange={handleOnChange}
			mode={SelectMode.SINGLE}
		/>
	);
};
