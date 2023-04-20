import { gql } from '@apollo/client';

import { Entity } from './use-schema';
// Can't use useApolloClient/useQuery/useParams here if not using Loader
import { apolloClient } from '../apollo';

import { generateGqlSelectForEntityFields } from './graphql';

export const PAGE_SIZE = 50;

export const queryForEntity = (entity: Entity, entityByType?: (type: string) => Entity) => {
	// If the entity is called SomeThing then the query name is someThing.
	const queryName = entity.name[0].toLowerCase() + entity.name.slice(1);

	// TODO: Is there a better way to build this than a big string?
	//
	// We looked into generating an AST here but it's really verbose and
	// doesn't seem that much cleaner than just generating a string.
	return gql`
		query AdminUIDetail($id: ID!) {
			result: ${queryName}(id: $id) {
				${generateGqlSelectForEntityFields(entity, entityByType)}
			}
		}
	`;
};
