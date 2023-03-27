import { MultiSelect, SelectOption } from '../multi-select';
import { Filter, useSchema } from '../utils';

export interface EnumFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter<string>) => void;
	initialFilter?: Filter<string>;
	resetCount: number; // We use this to reset the filter using the key
}

export const EnumFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: EnumFilterProps) => {
	const { entityByName, enumByName } = useSchema();
	const entityType = entityByName(entity);

	const field = entityType?.fields.find((f) => f.name === fieldName);
	let enumOptions: SelectOption[] = [];
	if (field) {
		const typeEnum = enumByName(field.type);
		enumOptions = Array.from(typeEnum.values).map((v) => ({
			label: v.name,
			value: v.value,
		}));
	}

	const handleOnChange = (options?: SelectOption[]) => {
		onChange?.(
			fieldName,
			(options ?? [])?.length > 0
				? //@todo this can be expanded to support the in operator { [`${fieldName}_in`]: options?.map((option) => option.value) }
				  ({ [fieldName]: options?.[0]?.value } as Filter<string>)
				: undefined
		);
	};

	return (
		<MultiSelect
			key={fieldName + resetCount}
			options={enumOptions}
			value={
				initialFilter?.[fieldName] ? [{ value: initialFilter?.[fieldName], label: undefined }] : []
			}
			placeholder={fieldName}
			onChange={handleOnChange}
		/>
	);
};
