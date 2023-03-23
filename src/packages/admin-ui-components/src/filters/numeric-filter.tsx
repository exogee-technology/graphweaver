import { Filter, SelectOption } from '../';
import { Input } from '../input';

interface NumericFilterProps {
	fieldName: string;
	entity?: string; // Unused but defined for a consistent API
	onChange?: (fieldName: string, filter?: Filter) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const NumericFilter = ({
	fieldName,
	onChange,
	selected,
	resetCount,
}: NumericFilterProps) => {
	const handleOnChange = (fieldName: string, value?: string) => {
		onChange?.(fieldName, value === '' ? undefined : { [fieldName]: value });
	};

	return (
		<Input
			key={`${fieldName}:${resetCount}`}
			inputMode="numeric"
			fieldName={fieldName}
			value={selected?.value}
			onChange={handleOnChange}
		/>
	);
};
