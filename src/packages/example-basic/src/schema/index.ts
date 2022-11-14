import { buildSchemaSync } from 'type-graphql';
import { UserGQLResolver } from './user';

export const schema = buildSchemaSync({
	resolvers: [UserGQLResolver],
});
