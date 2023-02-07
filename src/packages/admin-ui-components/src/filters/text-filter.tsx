import React, { useContext } from 'react';
import { DataContext, DataStateByEntity, Filter, Select, SelectOption, useSchema } from '..';

export const TextFilter = React.forwardRef(
	<T extends { id: string }>(
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
				options={textOptions}
				placeholder={fieldName}
				isClearable
				clearSelection
				ref={ref}
				onChange={onChange}
			/>
		);
	}
);
