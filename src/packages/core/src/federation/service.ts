import { SchemaBuilder, graphweaverMetadata } from '..';
import { Entity, Field } from '../decorators';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

export const addServiceQuery = ({
	schemaDirectives,
}: {
	schemaDirectives?: Record<string, any>;
}) => {
	@Entity('_service', { apiOptions: { excludeFromBuiltInOperations: true } })
	class Service {
		@Field(() => String)
		sdl!: string;
	}

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

	graphweaverMetadata.addQuery({
		name: '_service',
		description:
			'The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied.',
		intentionalOverride: true,
		getType: () => Service,
		resolver: () => {
			const schema = SchemaBuilder.build({
				schemaDirectives: {
					link,
					...(schemaDirectives ? schemaDirectives : {}),
				},
			});
			return {
				sdl: printSchemaWithDirectives(schema),
			};
		},
	});
};
