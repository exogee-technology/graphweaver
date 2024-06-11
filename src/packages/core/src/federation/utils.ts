import { SchemaBuilder, graphweaverMetadata } from '..';

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

export const getEntityTargets = function* () {
	for (const entity of graphweaverMetadata.entities()) {
		if (!excludeGraphweaverTypes.includes(entity.name)) yield entity;
	}
};

export const buildFederationSchema = ({
	schemaDirectives,
}: {
	schemaDirectives?: Record<string, any>;
}) => {
	const link = [
		...(schemaDirectives?.link ? [schemaDirectives.link] : []),
		{
			url: 'https://specs.apollo.dev/federation/v2.3',
			import: [
				'@composeDirective',
				'@extends',
				'@external',
				'@inaccessible',
				'@interfaceObject',
				'@key',
				'@override',
				'@provides',
				'@requires',
				'@shareable',
				'@tag',
			],
		},
	];

	// Remove link directive from schemaDirectives if it exists as it is added above
	delete schemaDirectives?.link;

	return SchemaBuilder.build({
		schemaDirectives: {
			link,
			...(schemaDirectives ? schemaDirectives : {}),
		},
	});
};
