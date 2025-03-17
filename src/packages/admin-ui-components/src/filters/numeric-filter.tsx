import { Filter } from '../';
import { Input } from '../input';

export interface NumericFilterProps {
	fieldName: string;
	entity: string; // Unused but defined for a consistent API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const NumericFilter = ({ fieldName, onChange, filter }: NumericFilterProps) => {
	const handleOnChange = (fieldName: string, newValue?: string) => {
		onChange?.(fieldName, newValue ? { [fieldName]: Number(newValue) } : {});
	};

	return (
		<Input
			key={fieldName}
			inputMode="numeric"
			fieldName={fieldName}
			value={String(filter?.[fieldName] ?? '')}
			onChange={handleOnChange}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
