import { mergeTypeDefs } from '@graphql-tools/merge';
import { SchemaBuilder, graphweaverMetadata } from '..';
import { Entity, Field } from '../decorators';
import { buildASTSchema } from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

export const federationSpec = `
scalar _Any
scalar FieldSet

directive @external on FIELD_DEFINITION
directive @requires(fields: FieldSet!) on FIELD_DEFINITION
directive @provides(fields: FieldSet!) on FIELD_DEFINITION
directive @key(fields: FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE
directive @shareable on OBJECT | FIELD_DEFINITION
directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
directive @tag(name: String!) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
directive @override(from: String!) on FIELD_DEFINITION
directive @composeDirective(name: String!) repeatable on SCHEMA

# This definition is required only for libraries that don't support
# GraphQL's built-in \`extend\` keyword
directive @extends on OBJECT | INTERFACE
`;

const addLinkDirective = `
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.3",
        import: ["@key"])`;

export const addServiceQuery = () => {
	@Entity('_service', { apiOptions: { excludeFromBuiltInOperations: true } })
	class Service {
		@Field(() => String)
		sdl!: string;
	}

	graphweaverMetadata.addQuery({
		name: '_service',
		description:
			'The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied.',
		intentionalOverride: true,
		getType: () => Service,
		resolver: () => {
			const schemaWithoutFederation = SchemaBuilder.build();
			const mergedSchema = mergeTypeDefs([
				schemaWithoutFederation,
				federationSpec,
				addLinkDirective,
			]);

			const merged = buildASTSchema(mergedSchema);
			const sdl = printSchemaWithDirectives(merged);

			return {
				sdl,
			};
		},
	});
};
