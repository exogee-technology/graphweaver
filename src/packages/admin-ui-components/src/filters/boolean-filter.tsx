import { Filter, ComboBox, SelectMode, SelectOption } from '..';

export interface BooleanFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const BooleanFilter = ({
	fieldName,
	onChange,
	initialFilter,
	resetCount,
}: BooleanFilterProps) => {
	const key = fieldName;
	const initialValue = initialFilter?.[key] as boolean | undefined;

	const options = [
		{ value: true, label: 'true' },
		{ value: false, label: 'false' },
	];

	const handleOnChange = (options: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(fieldName, hasSelectedOptions ? { [fieldName]: Boolean(options?.[0]?.value) } : {});
	};

	return (
		<ComboBox
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
