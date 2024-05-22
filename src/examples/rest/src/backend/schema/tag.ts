import { GraphQLEntity, RelationshipField, Field, ID, Entity } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Tag as OrmTag } from '../entities';
import { Task } from './task';
import { myConnection } from '../database';

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
@Entity('Tag', {
	provider: new MikroBackendProvider(OrmTag, myConnection),
})
export class Tag extends GraphQLEntity<OrmTag> {
	public dataEntity!: OrmTag;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@RelationshipField<Task>(() => [Task], { relatedField: 'tags', nullable: true })
	tasks?: Task[];
}
