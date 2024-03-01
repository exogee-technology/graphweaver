import { Filter } from '../';
import { Input } from '../input';

export interface NumericFilterProps {
	fieldName: string;
	entity: string; // Unused but defined for a consistent API
	onChange?: (newFilters: { key: string; newFilter?: Filter }[]) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const NumericFilter = ({
	fieldName,
	onChange,
	initialFilter,
	resetCount,
}: NumericFilterProps) => {
	const key = fieldName;
	const initialValue = initialFilter?.[key] as number | undefined;
	const handleOnChange = (fieldName: string, newValue?: string) => {
		const inputValue = newValue && !isNaN(+newValue) ? parseInt(newValue) : undefined;
		if (initialValue !== inputValue)
			onChange?.([
				{
					key: fieldName,
					newFilter: newValue === '' ? undefined : { [fieldName]: inputValue },
				},
			]);
	};

	return (
		<Input
			key={`${fieldName}:${resetCount}`}
			inputMode="numeric"
			fieldName={fieldName}
			value={initialValue !== undefined ? initialValue + '' : ''}
			onChange={handleOnChange}
		/>
	);
};
