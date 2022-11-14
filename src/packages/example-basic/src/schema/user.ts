import { Field, ID, ObjectType, Resolver } from 'type-graphql';
import { BaseDataEntity, createBaseResolver, GraphQLEntity } from '@exogee/base-resolver';
import { BigIntType, Entity, PrimaryKey, Property, Reference, Utils } from '@mikro-orm/core';
import { MikroBackendProvider } from '@exogee/database-entities';

// @todo should this be in the core mikro provider package?
class BaseEntity implements BaseDataEntity {
	public isReference(_: string, dataField: any) {
		return Reference.isReference<any>(dataField);
	}

	public isCollection(fieldName: string, dataField: any) {
		return Utils.isCollection<any>(dataField);
	}
}

@Entity({ tableName: 'User' })
class UserDBEntity extends BaseEntity {
	@PrimaryKey({ type: () => BigIntType })
	id!: string;

	@Property({ type: () => String })
	name!: string;
}

@ObjectType('User')
class UserGQLEntity extends GraphQLEntity<UserDBEntity> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}

@Resolver(() => UserGQLEntity)
export class UserGQLResolver extends createBaseResolver(
	UserGQLEntity,
	new MikroBackendProvider(UserDBEntity)
) {}
