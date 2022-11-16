import { createBaseResolver, GraphQLEntity } from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Field, ID, ObjectType, Resolver } from 'type-graphql';
import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User extends BaseEntity {
	@PrimaryKey({ type: () => BigIntType })
	id!: string;

	@Property({ type: () => String })
	name!: string;
}

@ObjectType('User')
class UserGQLEntity extends GraphQLEntity<User> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}

@Resolver(() => UserGQLEntity)
export class UserGQLResolver extends createBaseResolver(
	UserGQLEntity,
	new MikroBackendProvider(User)
) {}
