import { useApolloClient, useFragment } from '@apollo/client';

import { ComboBox, DataFetchOptions, SelectMode, SelectOption } from '../combo-box';
import { Filter, substringFilterForFields, useSchema } from '../utils';
import { fragmentForDisplayValueOfEntity, getRelationshipQuery } from './graphql';
import { toSelectOption } from './utils';
import { useCallback } from 'react';

export type RelationshipFilterType = { [fieldIn: string]: string[] };

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
	orderBy?: { [field: string]: 'ASC' | 'DESC' };

	// You can use this to enable users to search for related entities with text.
	// Make sure all fields are indexed to respond quickly to ILIKE queries. You
	// can do this in Postgres with trigram indexes. The component will 'or' all
	// fields you specify, so a match in any of them will be found. This is slow
	// and you should be very selective about which fields you enable this for.
	searchableFields?: string[];

	// Additional filter for items returned in the dropdown. You can use this to
	// constrain the list of items displayed to the user to choose from. It is
	// expressed relative to the entity displayed as rows in the dropdown.
	dropdownItemsFilter?: Filter;
}

const PAGE_SIZE = 100;

export const RelationshipFilter = ({
	fieldName,
	entity,
	onChange,
	orderBy,
	filter,
	searchableFields,
	dropdownItemsFilter,
}: RelationshipFilterProps) => {
	const { entityByName, entities } = useSchema();
	const apolloClient = useApolloClient();
	const entityType = entityByName(entity);
	const field = entityType?.fields.find((f) => f.name === fieldName);
	const relationshipEntity =
		field && field.relationshipType === 'MANY_TO_ONE'
			? entities.find((e) => e === field.type)
			: undefined;
	const relatedEntity = entityByName(relationshipEntity ?? '');

	const currentFilterValue =
		(filter?.[fieldName] as Record<string, string[]> | undefined)?.[
			`${relatedEntity.primaryKeyField}_in`
		] ?? [];

	// Should we have any searchable fields? we should grab them from the schema as well as
	// any that were passed in as a prop, deduplicating them.
	const relatedSearchableFieldsSet = new Set(searchableFields ?? []);

	// If there's a summary field on the entity, and that summary field is marked as searchable, then
	// it should be added to the searchable fields.
	if (
		relatedEntity?.summaryField &&
		relatedEntity.fields.find((f) => f.name === relatedEntity.summaryField)?.filter?.options
			?.substringMatch
	) {
		relatedSearchableFieldsSet.add(relatedEntity.summaryField);
	}

	const relatedSearchableFields = [...relatedSearchableFieldsSet].map((searchableField) => {
		const fieldMetadata = relatedEntity.fields.find((f) => f.name === searchableField);
		if (!fieldMetadata)
			throw new Error(`Field ${searchableField} not found on entity ${relatedEntity.name}`);
		return fieldMetadata;
	});

	// This reads the data for the related entity directly from the Apollo cache without going back to
	// the server. The reason we always get the first one is we only display the name in the filter if there's
	// one selected item. It will be in the cache because the grid will have fetched it.
	const { data: displayData } = useFragment({
		...fragmentForDisplayValueOfEntity(relatedEntity),
		from: {
			__typename: relatedEntity?.name ?? 'Empty',
			[relatedEntity?.primaryKeyField]: currentFilterValue[0],
		},
	});

	const handleOnChange = useCallback(
		(options?: SelectOption[]) => {
			if (!relatedEntity) {
				console.warn(
					`Related entity not found for field '${fieldName}' in entity '${entity}', ignoring change.`
				);
				return;
			}

			const hasSelectedOptions = (options ?? [])?.length > 0;
			onChange?.(
				fieldName,
				hasSelectedOptions
					? {
							[fieldName]: {
								[`${relatedEntity.primaryKeyField}_in`]: options?.map((option) => option.value),
							},
						}
					: {}
			);
		},
		[fieldName, onChange, relatedEntity?.primaryKeyField]
	);

	const dataFetcher = useCallback(
		async ({ page, searchTerm }: DataFetchOptions) => {
			const query = getRelationshipQuery(relatedEntity);
			if (!query) {
				console.warn(
					`Query not found for field '${fieldName}' in entity '${entity}', skipping data fetch.`
				);
				return [];
			}

			// If there's a user specified orderBy, use that. Otherwise, use the summary field if it exists,
			// otherwise fall back to the primary key field. We need some kind of sort so that the pagination
			// is deterministic.
			const orderByForQuery =
				orderBy ??
				(relatedEntity.summaryField
					? { [relatedEntity.summaryField]: 'ASC' }
					: { [relatedEntity.primaryKeyField]: 'ASC' });

			const { data } = await apolloClient.query<{ result: any[] }>({
				query,
				variables: {
					filter: substringFilterForFields(
						relatedSearchableFields,
						searchTerm ?? '',
						dropdownItemsFilter
					),
					pagination: {
						orderBy: orderByForQuery,
						limit: PAGE_SIZE,
						offset: Math.max(0, (page - 1) * PAGE_SIZE),
					},
				},
			});

			return data.result.map((item: any) => {
				const label = relatedEntity.summaryField ?? relatedEntity.primaryKeyField;
				return {
					label: label ? item[label] : 'notfound',
					value: item[relatedEntity.primaryKeyField],
				};
			});
		},
		[apolloClient, relatedEntity, orderBy, dropdownItemsFilter]
	);

	if (!relatedEntity) return null;

	const currentValue =
		currentFilterValue.length === 1
			? {
					label:
						displayData?.[relatedEntity.summaryField ?? relatedEntity.primaryKeyField] ??
						currentFilterValue[0],
					value: currentFilterValue[0],
				}
			: currentFilterValue.map(toSelectOption);

	return (
		<ComboBox
			key={fieldName}
			value={currentValue}
			placeholder={fieldName}
			onChange={handleOnChange}
			allowFreeTyping={!!relatedSearchableFields?.length}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
			dataFetcher={dataFetcher}
		/>
	);
};
