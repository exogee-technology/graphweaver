import { GraphQLEntity, SummaryField, Field, ID, ObjectType } from '@exogee/graphweaver';

import { User as OrmUser } from '../../entities';

@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;
}
