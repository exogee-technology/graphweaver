import { GraphQLEntity, createBaseResolver, BackendProvider } from '@exogee/graphweaver';
import { Resolver, Field, ObjectType, ID } from 'type-graphql';

import { caps, setNameOnResolver } from './util';

export interface ItemWithId {
	id: string;
	[key: string]: any;
}

export interface ResolverOptions<Entity, DataEntity> {
	name: string;
	provider: BackendProvider<DataEntity, Entity>;
	entity: any;
}

export const createResolver = <Entity extends ItemWithId, DataEntity>({
	name,
	provider,
	entity,
}: ResolverOptions<Entity, DataEntity>) => {
	const entityName = caps(name);

	// Create Base Resolver
	@Resolver(() => entity)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error @todo need to fix the type issue here
	class NewResolver extends createBaseResolver<DataEntity, Entity>(entity, provider) {}

	setNameOnResolver(NewResolver, `${entityName}Resolver`);

	return { provider, entity, resolver: NewResolver };
};
