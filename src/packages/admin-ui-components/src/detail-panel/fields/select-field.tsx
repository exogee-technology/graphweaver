import { useQuery } from '@apollo/client';
import { useField } from 'formik';
import { useEffect } from 'react';
import { SelectOption, Select, SelectMode } from '../../multi-select';
import { EntityField, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';

const mode = (entity: EntityField) => {
	if (entity.relationshipType === 'ONE_TO_ONE' || entity.relationshipType === 'MANY_TO_ONE') {
		return SelectMode.SINGLE;
	}

	return SelectMode.MULTI;
};

export const SelectField = ({ name, entity }: { name: string; entity: EntityField }) => {
	const [_, meta, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const { initialValue } = meta;
	const relationshipEntityType = entityByType(entity.type);

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const { data } = useQuery<{ result: Record<string, string>[] }>(
		getRelationshipQuery(entity.type, relationshipEntityType?.summaryField),
		{
			variables: {
				pagination: {
					orderBy: relationshipEntityType?.summaryField
						? {
								[relationshipEntityType.summaryField as string]: 'ASC',
						  }
						: { id: 'ASC' },
				},
			},
		}
	);

	const options = (data?.result ?? []).map<SelectOption>((item): SelectOption => {
		const label = relationshipEntityType?.summaryField || 'id';
		return { label: item[label], value: item.id };
	});

	const handleOnChange = (selected: SelectOption[]) => {
		const newValue = mode(entity) === SelectMode.MULTI ? selected : selected[0];

		helpers.setValue(newValue);
	};

	return (
		<Select
			options={options}
			value={[].concat(initialValue || [])} // supports both Many-To-One and One-To-Many relationships
			onChange={handleOnChange}
			mode={mode(entity)}
		/>
	);
};
