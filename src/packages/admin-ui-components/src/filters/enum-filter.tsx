import { Select, SelectOption } from '../select';
import { useSchema } from '../utils';

interface EnumFilterProps {
	fieldName: string;
	entity: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
}

export const EnumFilter = ({ fieldName, entity, onSelect, selected }: EnumFilterProps) => {
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

	const onChange = (option?: SelectOption) => {
		// option will be empty if 'clear' selected
		if (!onSelect) return;
		return onSelect(fieldName, option);
	};

	return (
		<Select
			key={fieldName}
			value={selected}
			options={enumOptions}
			placeholder={fieldName}
			isClearable
			clearSelection
			onChange={onChange}
		/>
	);
};
