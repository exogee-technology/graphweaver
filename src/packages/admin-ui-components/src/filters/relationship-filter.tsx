import { useLazyQuery } from '@apollo/client';

import { Select, SelectOption } from '../multi-select';
import { Filter, useSchema } from '../utils';
import { getRelationshipQuery } from './graphql';

export type RelationshipFilterType = { id_in: string[] } | undefined;

export interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	initialFilter?: Filter;
	resetCount: number; // We use this to reset the filter using the key
}

export const RelationshipFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: RelationshipFilterProps) => {
	const key = fieldName;
	const initialValue = initialFilter?.[key] as RelationshipFilterType | undefined;
	const { entityByName, entities } = useSchema();

	const entityType = entityByName(entity);
	const field = entityType?.fields.find((f) => f.name === fieldName);
	if (!field?.type) return null;

	const relationshipEntity =
		field && field.relationshipType === 'MANY_TO_ONE'
			? entities.find((e) => e === field.type)
			: undefined;

	if (!relationshipEntity) return null;

	const relationshipEntityType = entityByName(relationshipEntity);
	if (!relationshipEntityType.summaryField) return null;

	const orderBy = {
		[relationshipEntityType.summaryField]: 'ASC',
	};

	const handleOnChange = (options?: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(
			fieldName,
			hasSelectedOptions ? { [fieldName]: { id_in: options?.map((option) => option.value) } } : {}
		);
	};

	const [getRelationship, { data, loading, error }] = useLazyQuery<{ result: any[] }>(
		getRelationshipQuery(field.type, relationshipEntityType.summaryField),
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
		const label = relationshipEntityType.summaryField;
		return { label: label ? (item as any)[label] : 'notfound', value: item.id };
	});

	return (
		<Select
			key={`${fieldName}:${resetCount}`}
			options={relationshipOptions}
			value={
				initialValue?.id_in
					? initialValue.id_in.map((id) => ({
							value: id,
							label: id,
					  }))
					: []
			}
			placeholder={fieldName}
			onChange={handleOnChange}
			onOpen={handleOnOpen}
			loading={loading}
		/>
	);
};
