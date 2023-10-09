import { GraphQLEntity, SummaryField, Field, ID, ObjectType } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { User as RestUser } from '../../entities';

const acl: AccessControlList<User, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

@ApplyMultiFactorAuthentication<User>({
	Everyone: {
		// all users must provide a magic link mfa when writing data
		Read: [{ factorsRequired: 1, providers: [AuthenticationMethod.MAGIC_LINK] }],
	},
})
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
