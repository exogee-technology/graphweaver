import { BaseDataEntity, Entity, Field, GraphQLEntity, ID } from '@exogee/graphweaver';
import { GraphQLJSON, ISODateStringScalar } from '@exogee/graphweaver-scalars';

export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	userId: string;
	data: T;
	createdAt: Date;
}

@Entity('Authentication', {
	apiOptions: {
		excludeFromBuiltInOperations: true,
	},
})
export class Authentication<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	type!: string;

	@Field(() => ID)
	userId!: string;

	@Field(() => GraphQLJSON)
	data!: D;

	@Field(() => ISODateStringScalar)
	createdAt!: Date;
}
