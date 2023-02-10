import React, { useContext } from 'react';
import { DataContext, DataStateByEntity, Filter, Select, SelectOption, useSchema } from '..';

export const RelationshipFilter = React.forwardRef(
	<T extends { id: string }>(
		{
			fieldName,
			relationshipRefFieldName,
			entity,
			onSelect,
			selected,
		}: {
			fieldName: string;
			relationshipRefFieldName?: string;
			entity: string;
			onSelect?: (fieldName: string, option?: SelectOption) => void;
			selected?: SelectOption;
		},
		ref: any
	) => {
		const { entityByName, entities } = useSchema();
		const { entityState, setEntityState } = useContext(DataContext);

		const entityType = entityByName(entity);
		const field = entityType?.fields.find((f) => f.name === fieldName);

		const relationshipEntity =
			field && field.relationshipType === 'm:1'
				? entities.find((e) => e === field.type)
				: undefined;

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

		const onChange = (option?: SelectOption) => {
			// option will be empty if 'clear' selected
			if (!onSelect) return;
			return onSelect(relationshipRefFieldName ?? fieldName, option);
		};

		return (
			<Select
				key={fieldName}
				value={selected}
				options={relationshipOptions}
				placeholder={fieldName}
				isClearable
				clearSelection
				ref={ref}
				onChange={onChange}
			/>
		);
	}
);
