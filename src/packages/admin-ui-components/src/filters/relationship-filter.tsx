import React, { useContext } from 'react';
import { DataContext, DataStateByEntity, Filter, Select, SelectOption, useSchema } from '..';

export const RelationshipFilter = React.forwardRef(
	<T extends { id: string }>(
		{
			fieldName,
			refFieldName,
			entity,
			onSelect,
		}: {
			fieldName: string;
			refFieldName?: string;
			entity: string;
			onSelect?: (fieldName: string, filter?: Filter) => void;
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

		const data = (entityState as DataStateByEntity)[relationshipEntity]?.data as T[];
		let relationshipOptions: SelectOption[] = [];
		if (data && field && data.length > 0) {
			// Get a sorted list
			relationshipOptions = data
				// yuk
				.map((item) => ({ label: (item as any)[field.name], value: item.id }))
				.sort((a, b) => a?.label?.toLocaleLowerCase().localeCompare(b?.label?.toLocaleLowerCase()));
		}

		const onChange = (option?: SelectOption) => {
			// option will be empty if 'clear' selected
			// @todo: multiple filters
			if (!onSelect) return;
			if (!option) {
				return onSelect(fieldName, undefined);
			}
			return onSelect(fieldName, {
				filter: { kind: 'equals', field: refFieldName || fieldName, value: option.value },
			});
		};

		return (
			<Select
				key={fieldName}
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
