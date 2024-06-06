import {
	GraphQLList,
	GraphQLResolveInfo,
	ResolveTree,
	ResolverOptions,
	Source,
	graphQLTypeForEntity,
	graphweaverMetadata,
} from '..';
import { AnyGraphQLType } from './scalars';
import { list } from '../resolvers';

const excludeGraphweaverTypes = [
	'AdminUiEntityAttributeMetadata',
	'AdminUiFilterMetadata',
	'AdminUiFieldAttributeMetadata',
	'AdminUiFieldExtensionsMetadata',
	'AdminUiFieldMetadata',
	'AdminUiEntityMetadata',
	'AdminUiEnumValueMetadata',
	'AdminUiEnumMetadata',
	'AdminUiMetadata',
	'_service',
];

const getEntityTargets = function* () {
	for (const entity of graphweaverMetadata.entities()) {
		if (!excludeGraphweaverTypes.includes(entity.name)) yield entity;
	}
};

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
					returnType: new GraphQLList(graphQLType),
				};

				const results = await list({
					source: {} as Source, // @todo: What should this be?
					args: { input: entity },
					context,
					info: infoFacade as GraphQLResolveInfo,
					fields: {} as ResolveTree, // @todo: What should this be?
				});

				res.push(...results);
			}

			return res;
		},
	});
};
