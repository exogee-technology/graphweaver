import { useQuery } from '@apollo/client';

import { MultiSelect, SelectOption } from '../multi-select';
import { Filter, useSchema } from '../utils';
import { getRelationshipQuery } from './graphql';

export type RelationshipFilterType = { [x: string]: { id: string } } | undefined;

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter<RelationshipFilterType>) => void;
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
		field && field.relationshipType === 'm:1' ? entities.find((e) => e === field.type) : undefined;
	if (!relationshipEntity) return null;

	const relationshipEntityType = entityByName(relationshipEntity);
	if (!relationshipEntityType.summaryField) return null;

	const orderBy = {
		[relationshipEntityType.summaryField]: 'ASC',
	};

	const handleOnChange = (options?: SelectOption[]) => {
		onChange?.(
			fieldName,
			(options ?? [])?.length > 0
				? ({
						[fieldName]: {
							// @todo this can be expanded to support the in operator id_in: options?.map((option) => option.value),
							id: options?.[0]?.value,
						},
				  } as Filter<RelationshipFilterType>)
				: undefined
		);
	};

	const { data, loading } = useQuery<{ result: any[] }>(
		getRelationshipQuery(field.type, relationshipEntityType.summaryField),
		{
			variables: {
				pagination: {
					orderBy,
				},
			},
		}
	);

	const relationshipOptions = (data?.result ?? []).map<SelectOption>((item) => {
		const label = relationshipEntityType.summaryField;
		return { label: label ? (item as any)[label] : 'notfound', value: item.id };
	});

	return (
		<MultiSelect
			key={fieldName + resetCount}
			options={relationshipOptions}
			value={
				initialFilter?.[fieldName]?.id
					? [{ value: initialFilter?.[fieldName]?.id, label: undefined }]
					: []
			}
			placeholder={fieldName}
			onChange={handleOnChange}
			loading={loading}
		/>
	);
};
