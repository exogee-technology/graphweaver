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

export const RelationshipField = ({
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

	const convertToGqlVariables = (values: SelectOption[]) => {
		// If there are no values we can just return undefined and not send this attribute to the server
		if (!values || values.length === 0) {
			return undefined;
		}

		// If the field is a multi select field we need to convert the values to an array of IDs
		if (mode(entity) === SelectMode.MULTI) {
			return values.map((item) =>
				item && typeof item === 'object' && item.hasOwnProperty('value')
					? { [relatedEntity.primaryKeyField]: item.value }
					: item
			);
		}

		const singleValue = values[0];
		// If the field is a single select field we need to convert the value to an object with the ID
		if (singleValue && typeof singleValue === 'object' && 'value' in singleValue) {
			// Single select fields will be an object with the ID as the value and a human readable 'label' attribute
			// Extract out a simple { id: record_id } oject
			return { [relatedEntity.primaryKeyField]: singleValue.value };
		}

		// If the value is a simple string or number we can just return it as is
		return singleValue;
	};

	useEffect(() => {
		helpers.setValue(
			convertToGqlVariables(Array.isArray(initialValue) ? initialValue : [initialValue])
		);
	}, [initialValue]);

	const handleOnChange = (selected: SelectOption[]) => {
		helpers.setValue(convertToGqlVariables(selected));
	};

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

	let value = [];
	if (Array.isArray(initialValue)) {
		value = initialValue;
	} else if (initialValue !== null && initialValue !== undefined) {
		value = [initialValue];
	}

	return (
		<ComboBox
			options={options}
			value={value}
			onChange={handleOnChange}
			mode={mode(entity)}
			autoFocus={autoFocus}
		/>
	);
};
