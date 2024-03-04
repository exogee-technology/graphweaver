import { useLazyQuery } from '@apollo/client';

import { Select, SelectMode, SelectOption } from '../select';
import { Filter, useSchema } from '../utils';
import { getRelationshipQuery } from './graphql';

export type RelationshipFilterType = Record<string, { id: string }[]> | undefined;

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter) => void;
	initialFilter?: Filter<RelationshipFilterType>;
	resetCount: number; // We use this to reset the filter using the key
}

export const RelationshipFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
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
	if (!relatedEntity.summaryField) return null;

	const orderBy = {
		[relatedEntity.summaryField]: 'ASC',
	};

	const handleOnChange = (options?: SelectOption[]) => {
		onChange?.(
			fieldName,
			(options ?? [])?.length > 0
				? ({
						[fieldName]: {
							id_in: options?.map((option) => option.value),
						},
				  } as Filter<RelationshipFilterType>)
				: undefined
		);
	};

	const [getRelationship, { data, loading, error }] = useLazyQuery<{ result: any[] }>(
		getRelationshipQuery(relatedEntity.plural, relatedEntity.summaryField),
		{
			variables: {
				pagination: {
					orderBy,
				},
			},
		}
	);

	const handleOnOpen = () => {
		if (!data && !loading && !error) {
			getRelationship();
		}
	};

	const relationshipOptions = (data?.result ?? []).map<SelectOption>((item) => {
		const label = relatedEntity.summaryField;
		return { label: label ? (item as any)[label] : 'notfound', value: item.id };
	});

	return (
		<Select
			key={`${fieldName}:${resetCount}`}
			options={relationshipOptions}
			value={
				initialFilter?.[fieldName]?.id
					? [{ value: initialFilter?.[fieldName]?.id, label: undefined }]
					: []
			}
			placeholder={fieldName}
			onChange={handleOnChange}
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
		/>
	);
};
