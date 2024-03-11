import { ComboBox, SelectMode, SelectOption } from '../combo-box';
import { Filter, useSchema } from '../utils';

export interface EnumFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const EnumFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: EnumFilterProps) => {
	const key = `${fieldName}_in`;
	const initialValue = initialFilter?.[key] as string[] | undefined;
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
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(
			fieldName,
			hasSelectedOptions ? { [`${fieldName}_in`]: options?.map((option) => option.value) } : {}
		);
	};

	return (
		<ComboBox
			key={`${fieldName}:${resetCount}`}
			options={enumOptions}
			value={initialValue ? initialValue.map((value) => ({ value, label: undefined })) : []}
			placeholder={fieldName}
			onChange={handleOnChange}
			mode={SelectMode.MULTI}
		/>
	);
};
