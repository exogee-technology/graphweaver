import { graphweaverMetadata } from '../metadata';
import { Entity, Field } from '../decorators';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { buildFederationSchema } from './utils';

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

	graphweaverMetadata.addQuery({
		name: '_service',
		description:
			'The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied.',
		intentionalOverride: true,
		getType: () => Service,
		resolver: async () => {
			return {
				sdl: printSchemaWithDirectives(buildFederationSchema({ schemaDirectives })),
			};
		},
	});
};
