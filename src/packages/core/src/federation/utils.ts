import { EntityMetadata, SchemaBuilder } from '..';

export const buildFederationSchema = ({
	schemaDirectives,
	filterEntities,
}: {
	schemaDirectives?: Record<string, any>;
	filterEntities?: (entity: EntityMetadata<unknown, unknown>) => boolean;
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
	if (schemaDirectives) {
		const { link, ...restDirectives } = schemaDirectives;
		schemaDirectives = restDirectives;
	}

	return SchemaBuilder.build({
		filterEntities,
		schemaDirectives: {
			link,
			...(schemaDirectives ? schemaDirectives : {}),
		},
	});
};

// It's important that this sits separately from the places where it's used because the schema builder
// type caches are keyed by the actual instance of the filter function, so if we use different functions
// that are identical in implementation, we'll get different entity types popping out, which isn't necessary.
export const EXCLUDED_FROM_FEDERATION_ENTITY_FILTER = (entity: EntityMetadata<unknown, unknown>) =>
	!entity.apiOptions?.excludeFromFederation;
