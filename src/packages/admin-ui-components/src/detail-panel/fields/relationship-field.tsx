import { useQuery } from '@apollo/client';
import { useField } from 'formik';

import { SelectOption, ComboBox, SelectMode } from '../../combo-box';
import { EntityField, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';

const mode = (entity: EntityField) => {
	if (entity.relationshipType === 'ONE_TO_MANY' || entity.relationshipType === 'MANY_TO_MANY') {
		return SelectMode.MULTI;
	}

	return SelectMode.SINGLE;
};

function arrayify<T>(value: T) {
	if (Array.isArray(value)) return value;
	if (value !== null && value !== undefined) return [value];
	return [];
}

export const RelationshipField = ({
	name,
	entity,
	autoFocus,
}: {
	name: string;
	entity: EntityField;
	autoFocus: boolean;
}) => {
	const [{ value }, _, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const relatedEntity = entityByType(entity.type);

	const convertToGqlVariables = (values: SelectOption[]) => {
		// If there are no values we can just return undefined or an empty array
		if (!values || values.length === 0) {
			return mode(entity) === SelectMode.MULTI ? [] : undefined;
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

	const labelsById = new Map<string, string>();

	const options = (data?.result ?? []).map<SelectOption>((item): SelectOption => {
		const label = relatedEntity.summaryField || relatedEntity.primaryKeyField;
		const selectOption = { label: item[label], value: item[relatedEntity.primaryKeyField] };
		labelsById.set(selectOption.value, selectOption.label);
		return selectOption;
	});

	const valueForDisplay = arrayify(value).map((selectOption: SelectOption) => ({
		label: selectOption.label ?? labelsById.get(selectOption.value as string) ?? selectOption.value,
		value: selectOption.value,
	}));

	// If we've got our data back, we can look up the correct options in the result
	// so we have a proper description for them.
	if (data?.result)
		return (
			<ComboBox
				options={options}
				value={valueForDisplay}
				onChange={handleOnChange}
				mode={mode(entity)}
				autoFocus={autoFocus}
			/>
		);
};
