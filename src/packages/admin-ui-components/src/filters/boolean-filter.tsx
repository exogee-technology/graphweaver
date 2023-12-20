import { useField } from 'formik';
import { Filter, Select, SelectMode, SelectOption, useSchema } from '..';

export interface BooleanFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter) => void;
	initialFilter?: Filter<string>;
	resetCount: number; // We use this to reset the filter using the key
}

export const BooleanFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: BooleanFilterProps) => {
	// const [_, meta, helpers] = useField({ name: fieldName, multiple: false });
	const initialValue = initialFilter?.[fieldName];
	const options = [
		{ value: true, label: 'true' },
		{ value: false, label: 'false' },
	];

	console.log('************************\n');
	console.log('BOOLEAN FILTER');
	console.log(fieldName);
	console.log('************************\n');

	const handleOnChange = (options: SelectOption[]) => {
		// Change the state to be the new selection
		const value = options?.[0]?.value;
		// if (value === undefined) {
		// 	helpers.setValue(undefined);
		// } else {
		// 	helpers.setValue(value);
		// }
		onChange?.(
			fieldName,
			(options ?? [])?.length > 0
				? {
						[fieldName]: Boolean(options?.[0]?.value),
				  }
				: undefined
		);
	};

	return (
		<Select
			key={`${fieldName}:${resetCount}`}
			options={options}
			value={initialValue ? [{ value: initialValue, label: initialValue }] : []}
			placeholder={fieldName}
			onChange={handleOnChange}
		/>
	);
};
