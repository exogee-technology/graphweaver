import { Filter, Select, SelectMode, SelectOption, useSchema } from '..';

export interface BooleanFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (newFilters: { key: string; newFilter?: Filter }[]) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const BooleanFilter = ({
	fieldName,
	entity,
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
		onChange?.([
			{
				key: fieldName,
				newFilter:
					(options ?? [])?.length > 0
						? {
								[fieldName]: Boolean(options?.[0]?.value),
						  }
						: undefined,
			},
		]);
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
