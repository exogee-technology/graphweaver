import { useFragment, useLazyQuery } from '@apollo/client';

import { ComboBox, SelectMode, SelectOption } from '../combo-box';
import { Filter, useSchema } from '../utils';
import { fragmentForDisplayValueOfEntity, getRelationshipQuery } from './graphql';
import { toSelectOption } from './utils';
import { useState } from 'react';

export type RelationshipFilterType = { [fieldIn: string]: string[] };

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
	orderBy?: { [field: string]: 'ASC' | 'DESC' };

	// You can use this to enable users to search for related entities with text.
	// Make sure all fields are indexed to respond quickly to ILIKE queries. You
	// can do this in Postgres with trigram indexes. The component will or all
	// fields you specify, so a match in any of them will be found. This is slow
	// and you should be very selective about which fields you enable this for.
	searchableFields?: string[];
}

export const RelationshipFilter = ({
	fieldName,
	entity,
	onChange,
	orderBy,
	filter,
	searchableFields,
}: RelationshipFilterProps) => {
	const { entityByName, entities } = useSchema();
	const entityType = entityByName(entity);
	const [inputValue, setInputValue] = useState('');
	const field = entityType?.fields.find((f) => f.name === fieldName);
	if (!field?.type) return null;

	const relationshipEntity =
		field && field.relationshipType === 'MANY_TO_ONE'
			? entities.find((e) => e === field.type)
			: undefined;

	if (!relationshipEntity) return null;
	const relatedEntity = entityByName(relationshipEntity);

	const currentFilterValue =
		(filter?.[fieldName] as Record<string, string[]> | undefined)?.[
			`${relatedEntity.primaryKeyField}_in`
		] ?? [];

	// This reads the data for the related entity directly from the Apollo cache without going back to
	// the server. The reason we always get the first one is we only display the name in the filter if there's
	// one selected item. It will be in the cache because the grid will have fetched it.
	const { data: displayData } = useFragment({
		...fragmentForDisplayValueOfEntity(relatedEntity),
		from: {
			__typename: relatedEntity.name,
			[relatedEntity.primaryKeyField]: currentFilterValue[0],
		},
	});

	const handleOnChange = (options?: SelectOption[]) => {
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
	};

	const [fetchRelationshipOptionsList, { data, loading, error }] = useLazyQuery<{
		result: any[];
	}>(getRelationshipQuery(relatedEntity), {
		variables: {
			filter:
				searchableFields?.length && inputValue
					? searchableFields?.length === 1
						? {
								[`${searchableFields[0]}_ilike`]: `%${inputValue}%`,
							}
						: {
								// add an _or with ilike for each searchable field from props
								_or: searchableFields?.map((field) => ({
									[`${field}_ilike`]: `%${inputValue}%`,
								})),
							}
					: undefined,

			...(relatedEntity.summaryField
				? {
						pagination: {
							orderBy: orderBy ?? { [relatedEntity.summaryField]: 'ASC' },
						},
					}
				: {}),
		},
	});

	const handleOnOpen = () => {
		if (!data && !loading && !error) {
			fetchRelationshipOptionsList();
		}
	};

	const relationshipOptions = (data?.result ?? []).map<SelectOption>((item) => {
		const label = relatedEntity.summaryField ?? relatedEntity.primaryKeyField;
		return {
			label: label ? (item as any)[label] : 'notfound',
			value: item[relatedEntity.primaryKeyField],
		};
	});

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
			options={relationshipOptions}
			value={currentValue}
			placeholder={fieldName}
			onChange={handleOnChange}
			onInputChange={setInputValue}
			allowFreeTyping={!!searchableFields?.length}
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
