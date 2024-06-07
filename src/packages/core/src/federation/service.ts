import { SchemaBuilder, graphweaverMetadata } from '..';
import { Entity, Field } from '../decorators';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

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
			const schema = SchemaBuilder.build({
				schemaDirectives: {
					link: {
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
				},
			});
			return {
				sdl: printSchemaWithDirectives(schema),
			};
		},
	});
};
