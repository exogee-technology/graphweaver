import { BaseDataEntity, GraphQLEntity } from '@exogee/graphweaver';
import { ObjectType, Field, ID } from 'type-graphql';
import { ApplyAccessControlList } from '../../decorators';
import { AccessControlList, AuthorizationContext } from '../../types';

export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	userId: string;
	data: T;
	createdAt: Date;
}

@ObjectType('Authentication')
export class Authentication<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	type!: string;

	@Field(() => ID)
	userId!: string;

	@Field(() => JSON)
	data!: D;

	@Field(() => Date)
	createdAt!: Date;
}
