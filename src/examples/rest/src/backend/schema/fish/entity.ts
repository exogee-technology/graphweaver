import {
	GraphQLEntity,
	RelationshipField,
	Field,
	ID,
	ObjectType,
	SummaryField,
} from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { Fish as OrmFish } from '../../entities';
import { Task } from '../task';

const acl: AccessControlList<Fish, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only read fish
		read: true,
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any fish
		all: true,
	},
};

@ApplyMultiFactorAuthentication<Fish>(() => ({
	Everyone: {
		// all users must provide a magic link mfa when writing data
		Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.MAGIC_LINK] }],
	},
}))
@ApplyAccessControlList(acl)
@ObjectType('Fish')
export class Fish extends GraphQLEntity<OrmFish> {
	public dataEntity!: OrmFish;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'fish' })
	tasks!: Task[];
}
