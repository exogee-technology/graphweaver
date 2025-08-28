import { useApolloClient } from '@apollo/client';
import { useField } from 'formik';

import { useMemo, useCallback } from 'react';
import { ComboBox, DataFetchOptions, SelectMode, SelectOption } from '../../combo-box';
import { EntityField, substringFilterForFields, useSchema } from '../../utils';
import { getRelationshipQuery } from '../graphql';
import { useDataTransform } from '../use-data-transform';
import { getFieldId } from '../util';

const PAGE_SIZE = 100;

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
	const apolloClient = useApolloClient();
	const [{ value }, _, helpers] = useField({ name, multiple: false });
	const { entityByType } = useSchema();
	const relatedEntity = entityByType(field.type);
	const fieldId = getFieldId(name);

	// The form data works with select options for ease of management / display,
	// but when we go to the server, we need to convert these to the correct format
	// so that we don't trigger an update on the server of the related entity when
	// we're only changing the foreign key.
	useDataTransform({
		field,
		transform: async (value: unknown) => {
			if (value === null || value === undefined) {
				return value;
			}

			let arrayifiedValue = value;
			if (!Array.isArray(arrayifiedValue)) arrayifiedValue = [value];

			const mappedResults = (arrayifiedValue as SelectOption[]).map((item) => ({
				// NOTE: Just the ID should be fine to create a valid link record
				[relatedEntity.primaryKeyField]: item.value,
			}));

			return mode(field) === SelectMode.SINGLE ? mappedResults[0] : mappedResults;
		},
	});

	const onChange = useCallback(
		(value: SelectOption | SelectOption[]) => {
			let result: SelectOption | SelectOption[] | null = value;

			if (mode(field) === SelectMode.SINGLE) {
				if (Array.isArray(value)) {
					if (value.length === 0) {
						result = null;
					} else {
						result = value[0];
					}
				}
			}
			helpers.setValue(result);
		},
		[field, helpers]
	);

	const summaryFieldName = relatedEntity.summaryField || relatedEntity.primaryKeyField;
	const summaryFieldMetadata = relatedEntity.fields.find((f) => f.name === summaryFieldName);

	// Create searchable fields array for the utility function
	const searchableFields = useMemo(() => {
		if (summaryFieldMetadata?.filter?.options?.substringMatch) {
			return [summaryFieldMetadata];
		}
		return [];
	}, [summaryFieldMetadata]);

	// Data fetcher for pagination, infinite scroll, and search
	const dataFetcher = useCallback(
		async ({ page, searchTerm }: DataFetchOptions) => {
			const query = getRelationshipQuery(relatedEntity);

			const orderByForQuery = relatedEntity.summaryField
				? { [relatedEntity.summaryField as string]: 'ASC' }
				: { [relatedEntity.primaryKeyField]: 'ASC' };

			const generatedFilter = substringFilterForFields(searchableFields, searchTerm ?? '');

			const { data } = await apolloClient.query<{ result: any[] }>({
				query,
				variables: {
					filter: generatedFilter,
					pagination: {
						orderBy: orderByForQuery,
						limit: PAGE_SIZE,
						offset: Math.max(0, (page - 1) * PAGE_SIZE),
					},
				},
			});

			return data.result.map((item: any) => {
				const labelField = summaryFieldName;
				return {
					label: labelField ? item[labelField] : 'notfound',
					value: item[relatedEntity.primaryKeyField],
				};
			});
		},
		[relatedEntity, apolloClient, summaryFieldName, searchableFields]
	);

	// Normalize the value to ensure it has proper SelectOption structure
	const normalizedValue = useMemo(() => {
		if (!value) return [];

		const arrayifiedValue = Array.isArray(value) ? value : [value];

		return arrayifiedValue.map((item) => {
			// If item is already a SelectOption with both value and label, return as is
			if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
				return item;
			}

			// If item is just a value (primary key), we can't find the label without options
			// So we'll use the value as the label for now
			return { value: item, label: String(item) };
		});
	}, [value]);

	return (
		<ComboBox
			key={name}
			value={normalizedValue}
			onChange={onChange}
			mode={mode(field)}
			autoFocus={autoFocus}
			allowFreeTyping={!!summaryFieldMetadata?.filter?.options?.substringMatch}
			fieldId={fieldId}
			dataFetcher={dataFetcher}
		/>
	);
};
