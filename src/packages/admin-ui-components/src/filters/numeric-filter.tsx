import { SelectOption } from '../';
import { Input } from '../input';

interface NumericFilterProps {
	fieldName: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const NumericFilter = ({
	fieldName,
	onSelect,
	selected,
	resetCount,
}: NumericFilterProps) => {
	const onChange = (fieldName: string, value?: string) => {
		onSelect?.(fieldName, { label: selected?.label ?? fieldName, value: value });
	};

	return (
		<Input
			key={`${fieldName}:${resetCount}`}
			inputMode="numeric"
			fieldName={fieldName}
			value={selected?.value}
			onChange={onChange}
		/>
	);
};
