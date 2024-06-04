import { Entity, Field } from '../decorators';
import { graphweaverMetadata } from '../metadata';
import { SchemaBuilder } from '../schema-builder';

const addServiceQuery = () => {
	@Entity('_service', { apiOptions: { excludeFromBuiltInOperations: true } })
	class Service {
		@Field(() => String)
		sdl!: string;
	}

	graphweaverMetadata.addQuery({
		name: '_service',
		description: 'Query used by the Admin UI to introspect the schema and metadata.',
		intentionalOverride: true,
		getType: () => Service,
		resolver: () => ({
			sdl: SchemaBuilder.print({
				enableFederation: true,
			}),
		}),
	});
};

// enable federation
export const buildFederationType = () => {
	addServiceQuery();
};
