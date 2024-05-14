import { useQuery } from '@apollo/client';
import { useField } from 'formik';
import { useEffect } from 'react';

import { SelectOption, ComboBox, SelectMode } from '../../combo-box';
import { EntityField, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';

const mode = (entity: EntityField) => {
	if (entity.relationshipType === 'ONE_TO_MANY' || entity.relationshipType === 'MANY_TO_MANY') {
		return SelectMode.MULTI;
	}

	return SelectMode.SINGLE;
};

export const SelectField = ({
	name,
	entity,
	autoFocus,
}: {
	name: string;
	entity: EntityField;
	autoFocus: boolean;
}) => {
	const [_, meta, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const { initialValue } = meta;
	const relatedEntity = entityByType(entity.type);

	useEffect(() => {
		helpers.setValue(initialValue);
	}, []);

	const { data } = useQuery<{ result: Record<string, string>[] }>(
		getRelationshipQuery(relatedEntity),
		{
			variables: {
				pagination: {
					orderBy: relatedEntity.summaryField
						? {
								[relatedEntity.summaryField as string]: 'ASC',
							}
						: { [relatedEntity.primaryKeyField]: 'ASC' },
				},
			},
		}
	);

	const options = (data?.result ?? []).map<SelectOption>((item): SelectOption => {
		const label = relatedEntity.summaryField || relatedEntity.primaryKeyField;
		return { label: item[label], value: item[relatedEntity.primaryKeyField] };
	});

	const handleOnChange = (selected: SelectOption[]) => {
		const newValue = mode(entity) === SelectMode.MULTI ? selected : selected[0];

		helpers.setValue(newValue);
	};

	return (
		<ComboBox
			options={options}
			value={initialValue ? [initialValue] : []} // supports both Many-To-One and One-To-Many relationships
			onChange={handleOnChange}
			mode={mode(entity)}
			autoFocus={autoFocus}
		/>
	);
};
