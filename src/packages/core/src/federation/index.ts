import { addDirectives } from './directives';
import { addEntitiesQuery } from './entities';
import { addEnums } from './enums';
import { addServiceQuery } from './service';

export { buildFederationSchema } from './utils';

export const enableFederation = ({
	schemaDirectives,
}: {
	schemaDirectives?: Record<string, any>;
}) => {
	addEnums();
	addDirectives();
	addServiceQuery({ schemaDirectives });
	addEntitiesQuery();
};
