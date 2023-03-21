import React, { useContext } from 'react';
import { MultiSelect, SelectOption } from '../multi-select';
import { DataContext, DataStateByEntity, useSchema } from '../utils';

interface RelationshipFilterProps {
	fieldName: string;
	relationshipRefFieldName?: string;
	entity: string;
	onSelect?: (fieldName: string, option?: SelectOption) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const RelationshipFilter = <T extends { id: string }>({
	fieldName,
	relationshipRefFieldName,
	entity,
	onSelect,
	selected,
	resetCount,
}: RelationshipFilterProps) => {
	const { entityByName, entities } = useSchema();
	const { entityState, setEntityState } = useContext(DataContext);

	const entityType = entityByName(entity);
	const field = entityType?.fields.find((f) => f.name === fieldName);

	const relationshipEntity =
		field && field.relationshipType === 'm:1' ? entities.find((e) => e === field.type) : undefined;

	if (!relationshipEntity) return null;

	const relationshipEntityType = entityByName(relationshipEntity);
	const relationshipData = (entityState as DataStateByEntity)[relationshipEntity]?.data as T[];

	let relationshipOptions: SelectOption[] = [];
	if (relationshipData && field && relationshipData.length > 0) {
		// Get a sorted list
		relationshipOptions = relationshipData
			// yuk
			.map((item) => {
				const label = relationshipEntityType.summaryField;
				return { label: label ? (item as any)[label] : 'notfound', value: item.id };
			})
			.sort((a, b) => a?.label?.toLocaleLowerCase().localeCompare(b?.label?.toLocaleLowerCase()));
	}

	console.log(relationshipEntity);
	console.log(entityState);
	console.log(entity);
	console.log(relationshipData);
	console.log(fieldName);
	console.log(relationshipOptions);

	const onChange = (option?: SelectOption[]) => {
		// option will be empty if 'clear' selected
		if (!onSelect) return;
		return onSelect(relationshipRefFieldName ?? fieldName, option?.[0]);
	};

	return (
		<MultiSelect
			key={fieldName + resetCount}
			options={relationshipOptions}
			value={selected ? [selected] : []}
			placeholder={fieldName}
			onChange={onChange}
		/>
	);
};
