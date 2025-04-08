import { Filter, Input } from '..';

export interface TextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	caseInsensitive?: boolean;
	substringMatch?: boolean;
	filter?: Filter;
}

export const TextFilter = ({
	fieldName,
	onChange,
	filter,
	caseInsensitive,
	substringMatch,
}: TextFilterProps) => {
	const filterKey = caseInsensitive || substringMatch ? `${fieldName}_ilike` : fieldName;
	let value = String(filter?.[filterKey] ?? '');
	if (caseInsensitive || substringMatch) value = value.replaceAll('\\%', '%');
	if (substringMatch) value = value.slice(1, -1);

	return (
		<Input
			key={fieldName}
			inputMode="text"
			fieldName={fieldName}
			value={value}
			onChange={(fieldName: string, newValue?: string) => {
				// In either case we'll use ilike so we should escape any literal % characters
				if (caseInsensitive || substringMatch) newValue = newValue?.replaceAll('%', '\\%');
				if (substringMatch && newValue) newValue = `%${newValue}%`;

				onChange?.(fieldName, newValue ? { [filterKey]: newValue } : {});
			}}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
