import { useQuery } from '@apollo/client';
import { useField } from 'formik';

import { SelectOption, ComboBox, SelectMode } from '../../combo-box';
import { EntityField, Filter, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';

const mode = (field: EntityField) => {
	if (field.relationshipType === 'ONE_TO_MANY' || field.relationshipType === 'MANY_TO_MANY') {
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

	const convertToGqlVariables = (values: SelectOption[]) => {
		// If there are no values we can just return undefined or an empty array
		if (!values || values.length === 0) {
			return mode(field) === SelectMode.MULTI ? [] : undefined;
		}

		// If the field is a multi select field we need to convert the values to an array of IDs
		const mappedValues = values.map((item) =>
			item && typeof item === 'object' && item.hasOwnProperty('value')
				? { [relatedEntity.primaryKeyField]: item.value }
				: item
		);

		if (mode(field) === SelectMode.MULTI) {
			return mappedValues;
		} else {
			return mappedValues[0];
		}
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

	const valueForDisplay = arrayify(value).map((filter: Filter<string>) => {
		const id = filter[relatedEntity.primaryKeyField];

		return {
			value: id,
			label: labelsById.get(id) ?? id,
		};
	});

	// If we've got our data back, we can look up the correct options in the result
	// so we have a proper description for them.
	if (data?.result)
		return (
			<ComboBox
				options={options}
				value={valueForDisplay}
				onChange={handleOnChange}
				mode={mode(field)}
				autoFocus={autoFocus}
			/>
		);
};
