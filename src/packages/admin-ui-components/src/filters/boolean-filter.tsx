import { Filter, Select, SelectMode, SelectOption, useSchema } from '..';

export interface BooleanFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter) => void;
	initialValue?: boolean;
	resetCount: number; // We use this to reset the filter using the key
}

export const BooleanFilter = ({
	fieldName,
	entity,
	onChange,
	initialValue,
	resetCount,
}: BooleanFilterProps) => {
	const options = [
		{ value: true, label: 'true' },
		{ value: false, label: 'false' },
	];

	const handleOnChange = (options: SelectOption[]) => {
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
			value={
				initialValue !== undefined ? [{ value: initialValue, label: initialValue.toString() }] : []
			}
			placeholder={fieldName}
			onChange={handleOnChange}
			mode={SelectMode.SINGLE}
		/>
	);
};
