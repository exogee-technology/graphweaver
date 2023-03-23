import { useQuery } from '@apollo/client';

import { MultiSelect, SelectOption } from '../multi-select';
import { Filter, useSchema } from '../utils';
import { getRelationshipQuery } from './graphql';

interface RelationshipFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter) => void;
	selected?: SelectOption;
	resetCount: number; // We use this to reset the filter using the key
}

export const RelationshipFilter = <T extends { id: string }>({
	fieldName,
	entity,
	onChange,
	selected,
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
				? {
						[fieldName]: {
							// id_in: options?.map((option) => option.value),
							id: options?.[0]?.value,
						},
				  }
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
			value={selected ? [selected] : []}
			placeholder={fieldName}
			onChange={handleOnChange}
			loading={loading}
		/>
	);
};
