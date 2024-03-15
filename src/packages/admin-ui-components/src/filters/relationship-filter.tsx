import { useLazyQuery } from '@apollo/client';

import { ComboBox, SelectMode, SelectOption } from '../combo-box';
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
	const relatedEntity = entityByName(relationshipEntity);

	const handleOnChange = (options?: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(
			fieldName,
			hasSelectedOptions ? { [fieldName]: { id_in: options?.map((option) => option.value) } } : {}
		);
	};

	const [getRelationship, { data, loading, error }] = useLazyQuery<{
		result: any[];
	}>(getRelationshipQuery(relatedEntity.plural, relatedEntity.summaryField), {
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
			getRelationship();
		}
	};

	const relationshipOptions = (data?.result ?? []).map<SelectOption>((item) => {
		const label = relatedEntity.summaryField ?? 'id';
		return { label: label ? (item as any)[label] : 'notfound', value: item.id };
	});

	return (
		<ComboBox
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
			mode={SelectMode.MULTI}
		/>
	);
};
