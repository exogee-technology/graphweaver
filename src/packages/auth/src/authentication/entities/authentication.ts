import { BaseDataEntity, Entity, Field, GraphQLEntity, GraphQLID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '../../decorators';
import { AccessControlList, AuthorizationContext } from '../../types';

export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	userId: string;
	data: T;
	createdAt: Date;
}

@Entity('Authentication')
export class Authentication<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => GraphQLID)
	id!: string;

	@Field(() => String)
	type!: string;

	@Field(() => GraphQLID)
	userId!: string;

	@Field(() => JSON)
	data!: D;

	@Field(() => Date)
	createdAt!: Date;
}
