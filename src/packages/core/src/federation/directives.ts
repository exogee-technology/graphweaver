import { DirectiveLocation } from 'graphql';

import { graphweaverMetadata } from '..';
import { LinkPurpose } from './enums';
import { FieldSetGraphQLType, LinkImportGraphQLType } from './scalars';
import { getEntityTargets } from './utils';

const addKeyDirective = () => {
	// directive @key(fields: FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'key',
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
		// Ensure that the entity has a primary key field
		if (entity.fields[entity.primaryKeyField ?? ('id' as any)] === undefined) {
			continue;
		}

		graphweaverMetadata.collectEntityInformation({
			...entity,
			directives: {
				...(entity.directives ? entity.directives : {}),
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

// directive @tag(name: String!) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
export const addTagDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'tag',
		args: {
			name: {
				type: () => String,
				nullable: false,
			},
		},
		locations: [
			DirectiveLocation.FIELD_DEFINITION,
			DirectiveLocation.INTERFACE,
			DirectiveLocation.OBJECT,
			DirectiveLocation.UNION,
			DirectiveLocation.ARGUMENT_DEFINITION,
			DirectiveLocation.SCALAR,
			DirectiveLocation.ENUM,
			DirectiveLocation.ENUM_VALUE,
			DirectiveLocation.INPUT_OBJECT,
			DirectiveLocation.INPUT_FIELD_DEFINITION,
		],
		isRepeatable: true,
	});
};

//directive @shareable on OBJECT | FIELD_DEFINITION
const addShareableDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'shareable',
		locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
	});
};

// directive @external on FIELD_DEFINITION
const addExternalDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'external',
		locations: [DirectiveLocation.FIELD_DEFINITION],
	});
};

// directive @extends on OBJECT | INTERFACE
const addExtendsDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'extends',
		locations: [DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
	});
};

// directive @requires(fields: FieldSet!) on FIELD_DEFINITION
const addRequiresDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'requires',
		args: {
			fields: {
				type: () => FieldSetGraphQLType,
				nullable: false,
			},
		},
		locations: [DirectiveLocation.FIELD_DEFINITION],
	});
};

// directive @provides(fields: FieldSet!) on FIELD_DEFINITION
const addProvidesDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'provides',
		args: {
			fields: {
				type: () => FieldSetGraphQLType,
				nullable: false,
			},
		},
		locations: [DirectiveLocation.FIELD_DEFINITION],
	});
};

// directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
const addInaccessibleDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'inaccessible',
		locations: [
			DirectiveLocation.FIELD_DEFINITION,
			DirectiveLocation.INTERFACE,
			DirectiveLocation.OBJECT,
			DirectiveLocation.UNION,
			DirectiveLocation.ARGUMENT_DEFINITION,
			DirectiveLocation.SCALAR,
			DirectiveLocation.ENUM,
			DirectiveLocation.ENUM_VALUE,
			DirectiveLocation.INPUT_OBJECT,
			DirectiveLocation.INPUT_FIELD_DEFINITION,
		],
	});
};

// directive @override(from: String!) on FIELD_DEFINITION
const addOverrideDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'override',
		args: {
			from: {
				type: () => String,
				nullable: false,
			},
		},
		locations: [DirectiveLocation.FIELD_DEFINITION],
	});
};

// directive @composeDirective(name: String!) repeatable on SCHEMA
const addComposeDirective = () => {
	graphweaverMetadata.collectDirectiveTypeInformation({
		name: 'composeDirective',
		args: {
			name: {
				type: () => String,
				nullable: false,
			},
		},
		locations: [DirectiveLocation.SCHEMA],
		isRepeatable: true,
	});
};

export const addDirectives = () => {
	addLinkDirective();
	addKeyDirective();
	addTagDirective();
	addShareableDirective();
	addExternalDirective();
	addExtendsDirective();
	addRequiresDirective();
	addProvidesDirective();
	addInaccessibleDirective();
	addOverrideDirective();
	addComposeDirective();
};
