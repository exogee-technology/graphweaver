import { Filter } from '../';
import { Input } from '../input';

interface NumericFilterProps {
	fieldName: string;
	entity?: string; // Unused but defined for a consistent API
	onChange?: (fieldName: string, filter?: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const NumericFilter = ({
	fieldName,
	onChange,
	initialFilter,
	resetCount,
}: NumericFilterProps) => {
	const value = initialFilter?.[fieldName] as number | undefined;

	const handleOnChange = (fieldName: string, newValue?: string) => {
		const inputValue = newValue && !isNaN(+newValue) ? parseInt(newValue) : undefined;
		if (value !== inputValue)
			onChange?.(fieldName, newValue === '' ? undefined : { [fieldName]: inputValue });
	};

	return (
		<Input
			key={`${fieldName}:${resetCount}`}
			inputMode="numeric"
			fieldName={fieldName}
			value={value !== undefined && resetCount === 0 ? value + '' : ''}
			onChange={handleOnChange}
		/>
	);
};
