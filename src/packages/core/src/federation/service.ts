import { graphweaverMetadata } from '../metadata';
import { Entity, Field } from '../decorators';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { EXCLUDED_FROM_FEDERATION_ENTITY_FILTER, buildFederationSchema } from './utils';

export const addServiceQuery = ({
	schemaDirectives,
}: {
	schemaDirectives?: Record<string, any>;
}) => {
	@Entity('_Service', {
		apiOptions: { excludeFromBuiltInOperations: true },
	})
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
		resolver: async () => ({
			sdl: printSchemaWithDirectives(
				buildFederationSchema({
					schemaDirectives,

					// For the _service query, we want to include all entities except for entities that have been marked as excluded from federation
					filterEntities: EXCLUDED_FROM_FEDERATION_ENTITY_FILTER,
				})
			),
		}),
	});
};
