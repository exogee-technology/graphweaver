import { DirectiveLocation } from 'graphql';

import { graphweaverMetadata } from '..';
import { LinkPurpose } from './enums';
import { FieldSetGraphQLType, LinkImportGraphQLType } from './scalars';
import { getEntityTargets } from './utils';

const addKeyDirective = () => {
	// directive @key(fields: FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'key',
		target: {}, // Do we need to pass the target here?
		args: {
			fields: {
				type: () => FieldSetGraphQLType,
				nullable: false,
			},
			resolvable: {
				type: () => Boolean,
				nullable: true,
				defaultValue: true,
			},
		},
		locations: [DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
		isRepeatable: true,
	});

	// Add the key directive to all entities
	const entities = Array.from(getEntityTargets());

	for (const entity of entities) {
		graphweaverMetadata.collectEntityInformation({
			...entity,
			directives: {
				key: {
					fields: entity.primaryKeyField ?? 'id',
				},
			},
		});
	}
};

const addLinkDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'link',
		target: {}, // Do we need to pass the target here?
		args: {
			url: {
				type: () => String,
				nullable: false,
			},
			as: {
				type: () => String,
				nullable: true,
			},
			for: {
				type: () => LinkPurpose,
				nullable: true,
			},
			import: {
				type: () => [LinkImportGraphQLType],
				nullable: true,
			},
		},
		locations: [DirectiveLocation.SCHEMA],
		isRepeatable: true,
	});
};

export const addDirectives = () => {
	addLinkDirective();
	addKeyDirective();
};
