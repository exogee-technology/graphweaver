import { gql } from '@apollo/client';

import { Entity } from './use-schema';

import { generateGqlSelectForEntityFields } from './graphql';

export const PAGE_SIZE = 50;

export const queryForEntity = (entity: Entity, entityByType?: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThing.
	const queryName = entity.name[0].toLowerCase() + entity.name.slice(1);

	return gql`
		query AdminUIDetail($id: ID!) {
			result: ${queryName}(id: $id) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
		}
	`;
};
