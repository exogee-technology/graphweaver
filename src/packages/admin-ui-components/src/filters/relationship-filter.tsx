import { useApolloClient } from '@apollo/client';
import { ComboBox, DataFetchOptions, SelectMode, SelectOption } from '../combo-box';
import { Filter, substringFilterForFields, useSchema } from '../utils';
import { fragmentForDisplayValueOfEntity, getRelationshipQuery } from './graphql';
import { useCallback } from 'react';
import { toSelectOption } from './utils';

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
	const relationshipEntity = field ? entities.find((e) => e === field.type) : undefined;
	const relatedEntity = entityByName(relationshipEntity ?? '');

	// First try with _in
	let currentFilterValue: string[] | undefined = (
		filter?.[fieldName] as Record<string, string[]> | undefined
	)?.[`${relatedEntity.primaryKeyField}_in`];

	// If that didn't do it, then try with just the primary key field.
	// Arrayify if it exists.
	if (!currentFilterValue) {
		const maybePrimaryKey = (filter?.[fieldName] as Record<string, string> | undefined)?.[
			relatedEntity.primaryKeyField
		];

		if (maybePrimaryKey) currentFilterValue = [maybePrimaryKey];
	}

	// Ok, must be no filter.
	if (!currentFilterValue) currentFilterValue = [];

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

	const currentValue = currentFilterValue.map((value) => {
		// Read the labels for these entities from the Apollo cache.
		const displayValue = apolloClient.readFragment({
			...fragmentForDisplayValueOfEntity(relatedEntity),
			id: apolloClient.cache.identify({
				__typename: relatedEntity?.name,
				[relatedEntity?.primaryKeyField ?? 'id']: value,
			}),
		});

		if (displayValue) {
			return {
				label: displayValue[relatedEntity.summaryField ?? relatedEntity.primaryKeyField] ?? value,
				value,
			};
		}

		// And if they're not found, just return the value as the label.
		return toSelectOption(value);
	});

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
