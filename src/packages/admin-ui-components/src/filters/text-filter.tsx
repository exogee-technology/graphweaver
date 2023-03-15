import React, { useContext } from 'react';
import { DataContext, DataStateByEntity, Select, SelectOption, useSchema } from '..';

interface TextFilterProps {
	fieldName: string;
	entity: string;
	// onSelect?: (fieldName: string, filter?: Filter) => void;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
}

export const TextFilter = <T extends { id: string }>({
	fieldName,
	entity,
	onSelect,
	selected,
}: TextFilterProps) => {
	const { entityByName } = useSchema();
	const { entityState, setEntityState } = useContext(DataContext);

	const entityType = entityByName(entity);
	const data = (entityState as DataStateByEntity)[entity]?.data as T[];
	const field = entityType?.fields.find((f) => f.name === fieldName);
	let textOptions: SelectOption[] = [];
	if (data && field && data.length > 0) {
		// Get a unique, sorted list
		textOptions = data
			// yuk
			.map((item) => (item as any)[field.name])
			.reduce((arr: string[], item) => {
				if (!arr.includes(item)) {
					arr.push(item);
				}
				return arr;
			}, [])
			.sort((a, b) => a?.toLocaleLowerCase().localeCompare(b?.toLocaleLowerCase()))
			// value = label, we don't care
			.map((item) => ({ label: item, value: item }));
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
			options={textOptions}
			placeholder={fieldName}
			isClearable
			clearSelection
			onChange={onChange}
		/>
	);
};
