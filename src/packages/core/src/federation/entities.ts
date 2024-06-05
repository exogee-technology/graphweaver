import { graphweaverMetadata } from '..';
import { AnyGraphQLType } from './scalars';

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
		resolver: () => {},
	});
};
