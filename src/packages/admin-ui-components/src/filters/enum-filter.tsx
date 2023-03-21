import { MultiSelect, SelectOption } from '../multi-select';
import { useSchema } from '../utils';

interface EnumFilterProps {
	fieldName: string;
	entity: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const EnumFilter = ({
	fieldName,
	entity,
	onSelect,
	selected,
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

	const onChange = (option?: SelectOption[]) => {
		if (!onSelect) return;
		return onSelect(fieldName, option?.[0]);
	};

	return (
		<MultiSelect
			key={fieldName + resetCount}
			options={enumOptions}
			value={selected ? [selected] : []}
			placeholder={fieldName}
			onChange={onChange}
		/>
	);
};
