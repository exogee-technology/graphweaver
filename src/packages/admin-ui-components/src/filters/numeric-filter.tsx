import { Filter } from '../';
import { Input } from '../input';

export interface NumericFilterProps {
	fieldName: string;
	entity: string; // Unused but defined for a consistent API
	onChange?: (key: string, newFilter?: Filter) => void;
	initialValue?: number;
	resetCount: number; // We use this to reset the filter using the key
}

export const NumericFilter = ({
	fieldName,
	onChange,
	initialValue,
	resetCount,
}: NumericFilterProps) => {
	const handleOnChange = (fieldName: string, newValue?: string) => {
		const inputValue = newValue && !isNaN(+newValue) ? parseInt(newValue) : undefined;
		if (initialValue !== inputValue)
			onChange?.(fieldName, newValue === '' ? undefined : { [fieldName]: inputValue });
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
