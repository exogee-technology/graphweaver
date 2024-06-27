import { graphweaverMetadata } from '../metadata';
import { GraphQLResolveInfo, ResolveTree, ResolverOptions } from '../types';
import { AnyGraphQLType } from './scalars';
import { getOne } from '../resolvers';
import { getEntityTargets } from './utils';
import { graphQLTypeForEntity } from '../schema-builder';
import { Source } from 'graphql';

export const addEntitiesQuery = () => {
	const EntitiesUnion = graphweaverMetadata.collectUnionTypeInformation({
		name: '_Entity',
		getTypes: () => Array.from(getEntityTargets()),
	});

	graphweaverMetadata.addQuery({
		name: '_entities',
		description:
			'Union of all types in this subgraph. This information is needed by the Apollo federation gateway.',
		getType: () => EntitiesUnion,
		args: {
			representations: {
				type: () => [AnyGraphQLType],
				nullable: false,
			},
		},
		resolver: async ({ args, context }: ResolverOptions) => {
			// 1. Create an empty array that will contain the entity objects to return.
			// 2. For each entity representation included in the representations list:
			//  a. Obtain the entity's __typename from the representation.
			//  b. Pass the full representation object to whatever mechanism the library provides the subgraph developer for fetching entities of the corresponding __typename.
			//  c. Add the fetched entity object to the array of entity objects. Make sure objects are listed in the same order as their corresponding representations.
			// 3. Return the array of entity objects.

			const res: unknown[] = [];

			for (const entity of args.representations) {
				const metadata = graphweaverMetadata.getEntityByName(entity.__typename);
				if (!metadata?.target) {
					throw new Error(`Could not locate metadata for the '${entity.__typename}' entity`);
				}
				const graphQLType = graphQLTypeForEntity(metadata);

				// This is a fake GraphQL Resolve Info we pass to ourselves so the resolver will return the correct
				// result type. The only thing we read in it is the return type, so we'll just stub that.
				const infoFacade: Partial<GraphQLResolveInfo> = {
					returnType: graphQLType,
				};

				// each entity in representations is a request for a single instance of that entity
				const results = await getOne({
					source: {} as Source, // @todo: What should this be?
					args: { input: entity },
					context,
					info: infoFacade as GraphQLResolveInfo,
					fields: {} as ResolveTree, // @todo: What should this be?
				});

				res.push(results);
			}

			return res;
		},
	});
};
