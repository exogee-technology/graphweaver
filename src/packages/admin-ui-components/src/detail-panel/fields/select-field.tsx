import { useQuery } from '@apollo/client';
import { useField } from 'formik';
import { useEffect } from 'react';
import { SelectOption, Select, SelectMode } from '../../multi-select';
import { EntityField, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';

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
					orderBy: relationshipEntityType
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
		helpers.setValue(selected?.[0]);
	};

	return (
		<Select
			options={options}
			value={initialValue ? [initialValue] : []}
			onChange={handleOnChange}
			mode={
				entity.relationshipType === 'ONE_TO_ONE' || entity.relationshipType === 'MANY_TO_ONE'
					? SelectMode.SINGLE
					: SelectMode.MULTI
			}
		/>
	);
};
