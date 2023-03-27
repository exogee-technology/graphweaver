import { GraphQLEntity, AdminUISettings } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

import { User as OrmUser } from '../../entities';

@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;
}
