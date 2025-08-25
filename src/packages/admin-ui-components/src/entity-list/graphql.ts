import { gql } from '@apollo/client';
import { AggregationType, Entity, generateGqlSelectForEntityFields } from '../utils';

export type QueryResponse<TData> = {
	result: TData[];
	aggregate?: { count: number };
};

export const getEntityListQueryName = (entity: Entity) => {
	const pluralEntityName = entity.plural;
	return `${pluralEntityName}List`;
};

export const queryForEntityPage = (entityName: string, entityByType: (type: string) => Entity) => {
	const entity = entityByType(entityName);
	const pluralEntityName = entity.plural;
	const entityFieldName = pluralEntityName[0].toLowerCase() + pluralEntityName.slice(1);
	const queryName = getEntityListQueryName(entity);
	const entityCanCount = entity.supportedAggregationTypes.includes(AggregationType.COUNT);
	const parameterDeclaration = [
		`$detailFilter: ${pluralEntityName}ListFilter`,
		entityCanCount ? ` $countFilter: ${pluralEntityName}ListFilter` : undefined,
		`$pagination: ${pluralEntityName}PaginationInput`,
	]
		.filter(Boolean)
		.join(', ');

	return gql`
		query ${queryName}( ${parameterDeclaration} ) {
			result: ${entityFieldName}(filter: $detailFilter, pagination: $pagination) {
				${generateGqlSelectForEntityFields(entity.fields.filter((field) => !field.hideInTable), entityByType)}
			}
			${entityCanCount ? `aggregate: ${entityFieldName}_aggregate(filter: $countFilter) { count }` : ''}
		}
	`;
};
