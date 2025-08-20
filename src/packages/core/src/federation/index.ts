import { graphweaverMetadata } from '../index.js';
import { addDirectives } from './directives';
import { addEntitiesQuery } from './entities';
import { addEnums } from './enums';
import { addServiceQuery } from './service';

export { buildFederationSchema } from './utils';

export const enableFederation = ({
	schemaDirectives,
	federationSubgraphName,
}: {
	schemaDirectives?: Record<string, any>;
	federationSubgraphName: string;
}) => {
	graphweaverMetadata.federationSubgraphName = federationSubgraphName;

	addEnums();
	addDirectives();
	addServiceQuery({ schemaDirectives });
	addEntitiesQuery();
};
