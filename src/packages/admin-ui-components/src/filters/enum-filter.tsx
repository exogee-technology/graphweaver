import React from 'react';
import { Filter, Select, SelectOption, useSchema } from '..';

export const EnumFilter = React.forwardRef(
	(
		{
			fieldName,
			entity,
			onSelect,
		}: {
			fieldName: string;
			entity: string;
			onSelect?: (fieldName: string, filter?: Filter) => void;
		},
		ref: any
	) => {
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
			// @todo: multiple filters
			if (!onSelect) return;
			if (!option) {
				return onSelect(fieldName, undefined);
			}
			return onSelect(fieldName, {
				filter: { kind: 'equals', field: fieldName, value: option.value },
			});
		};

		return (
			<Select
				key={fieldName}
				options={enumOptions}
				placeholder={fieldName}
				isClearable
				clearSelection
				ref={ref}
				onChange={onChange}
			/>
		);
	}
);
