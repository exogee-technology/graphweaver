import {
	GraphQLResolveInfo,
	ResolveTree,
	ResolverOptions,
	Source,
	graphQLTypeForEntity,
	graphweaverMetadata,
} from '..';
import { AnyGraphQLType } from './scalars';
import { getOne } from '../resolvers';
import { EXCLUDED_FROM_FEDERATION_ENTITY_FILTER } from './utils';

export const addEntitiesQuery = () => {
	const EntitiesUnion = graphweaverMetadata.collectUnionTypeInformation({
		name: '_Entity',
		getTypes: () =>
			Array.from(graphweaverMetadata.entities()).filter(
				// The _Service entity should not be included in the _Entity union specifically
				// but we don't want to omit it from the whole SDL returned by the _service query itself
				// so we're just going to filter it out explicitly here.
				(entity) => EXCLUDED_FROM_FEDERATION_ENTITY_FILTER(entity) && entity.name !== '_Service'
			),
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

				// If it's excluded from federation, we don't want it in the _entities response.
				if (metadata.apiOptions?.excludeFromFederation) continue;

				const graphQLType = graphQLTypeForEntity(metadata, EXCLUDED_FROM_FEDERATION_ENTITY_FILTER);

				// This is a fake GraphQL Resolve Info we pass to ourselves so the resolver will return the correct
				// result type. The only thing we read in it is the return type, so we'll just stub that.
				const infoFacade: Partial<GraphQLResolveInfo> = {
					returnType: graphQLType,
				};

				// each entity in representations is a request for a single instance of that entity
				const results = await getOne({
					source: {} as Source,
					args: { input: entity },
					context,
					info: infoFacade as GraphQLResolveInfo,
					fields: {} as ResolveTree,
				});

				res.push(results);
			}

			return res;
		},
	});
};
