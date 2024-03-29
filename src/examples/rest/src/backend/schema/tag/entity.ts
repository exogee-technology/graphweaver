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

import { Tag as OrmTag } from '../../entities';
import { Task } from '../task';

const acl: AccessControlList<Tag, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only read tags
		read: true,
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
};

@ApplyMultiFactorAuthentication<Tag>(() => ({
	LIGHT_SIDE: {
		// all users must provide a magic link mfa when writing data
		Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.MAGIC_LINK] }],
	},
}))
@ApplyAccessControlList(acl)
@ObjectType('Tag')
export class Tag extends GraphQLEntity<OrmTag> {
	public dataEntity!: OrmTag;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}
