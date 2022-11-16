import { buildSchemaSync } from 'type-graphql';
import { User as UserEntity, UserGQLResolver } from './user';

export const mikroOrmEntities = [UserEntity];

export const schema = buildSchemaSync({
	resolvers: [UserGQLResolver],
});
