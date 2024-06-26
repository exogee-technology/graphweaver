import { ComboBox, SelectMode, SelectOption } from '../combo-box';
import { Filter, useSchema } from '../utils';
import { toSelectOption } from './utils';

export interface EnumFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const EnumFilter = ({ fieldName, entity, onChange, filter }: EnumFilterProps) => {
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

	const currentFilterValue = (filter?.[`${fieldName}_in`] as string[]) ?? [];

	return (
		<ComboBox
			key={fieldName}
			options={enumOptions}
			value={currentFilterValue.map(toSelectOption)}
			placeholder={fieldName}
			onChange={handleOnChange}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
