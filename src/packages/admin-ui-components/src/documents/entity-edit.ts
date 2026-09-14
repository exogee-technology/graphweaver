import { gql } from 'graphql-tag';

import { Entity } from '../utils/schema-types.js';
import { generateGqlSelectForEntityFields } from './select.js';

export const queryForEntityEdit = (entity: Entity, entityByType?: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThing.
	const queryName = entity.name[0].toLowerCase() + entity.name.slice(1);

	return gql`
		query ${entity.name}Detail($id: ID!) {
			result: ${queryName}(id: $id) {
				${generateGqlSelectForEntityFields(
					entity.fields.filter((field) => !field.hideInDetailForm),
					entityByType
				)}
			}
		}
	`;
};
