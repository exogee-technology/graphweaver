import { useFragment, useLazyQuery } from '@apollo/client';

import { ComboBox, SelectMode, SelectOption } from '../combo-box';
import { Filter, useSchema } from '../utils';
import { fragmentForDisplayValueOfEntity, getRelationshipQuery } from './graphql';
import { toSelectOption } from './utils';

export type RelationshipFilterType = { [fieldIn: string]: string[] };

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const RelationshipFilter = ({
	fieldName,
	entity,
	onChange,
	filter,
}: RelationshipFilterProps) => {
	const { entityByName, entities } = useSchema();
	const entityType = entityByName(entity);
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
			...(relatedEntity.summaryField
				? {
						pagination: {
							orderBy: { [relatedEntity.summaryField]: 'ASC' },
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
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
