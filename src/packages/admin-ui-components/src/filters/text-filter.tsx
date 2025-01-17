import { Filter, Input } from '..';

export interface TextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const TextFilter = ({ fieldName, onChange, filter }: TextFilterProps) => {
	const handleOnChange = (fieldName: string, newValue?: string) => {
		onChange?.(fieldName, newValue ? { [fieldName]: newValue } : {});
	};

	return (
		<Input
			key={fieldName}
			inputMode="text"
			fieldName={fieldName}
			value={String(filter?.[fieldName] ?? '')}
			onChange={handleOnChange}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
