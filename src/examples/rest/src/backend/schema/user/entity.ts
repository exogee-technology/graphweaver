import { GraphQLEntity, SummaryField } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { AccessControlList, ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { User as RestUser } from '../../entities';
import { Context } from '../..';

const acl: AccessControlList<User, Context> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ id: context.user.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

@ApplyAccessControlList(acl)
@ObjectType('User')
export class User extends GraphQLEntity<RestUser> {
	public dataEntity!: RestUser;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;
}
