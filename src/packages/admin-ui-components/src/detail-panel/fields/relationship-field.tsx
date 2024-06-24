import { useQuery } from '@apollo/client';
import { useField } from 'formik';

import { SelectOption, ComboBox, SelectMode } from '../../combo-box';
import { EntityField, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';
import { useDataTransform } from '../use-data-transform';

const mode = (field: EntityField) => {
	if (field.relationshipType === 'ONE_TO_MANY' || field.relationshipType === 'MANY_TO_MANY') {
		return SelectMode.MULTI;
	}

	return SelectMode.SINGLE;
};

export const RelationshipField = ({
	name,
	field,
	autoFocus,
}: {
	name: string;
	field: EntityField;
	autoFocus: boolean;
}) => {
	const [{ value }, _, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const relatedEntity = entityByType(field.type);

	// The form data works with select options for ease of management / display,
	// but when we go to the server, we need to convert these to the correct format
	// so that we don't trigger an update on the server of the related entity when
	// we're only changing the foreign key.
	useDataTransform({
		field,
		transform: async (value: unknown) => {
			if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
				return undefined;
			}

			let arrayifiedValue = value;
			if (!Array.isArray(arrayifiedValue)) arrayifiedValue = [value];

			const mappedResults = (arrayifiedValue as SelectOption[]).map((item) => ({
				[relatedEntity.primaryKeyField]: item.value,
			}));

			if (mode(field) === SelectMode.MULTI) {
				return mappedResults;
			}
			return mappedResults[0];
		},
	});

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

	if (data?.result) {
		return (
			<ComboBox
				options={options}
				value={value}
				onChange={helpers.setValue}
				mode={mode(field)}
				autoFocus={autoFocus}
			/>
		);
	}
};
