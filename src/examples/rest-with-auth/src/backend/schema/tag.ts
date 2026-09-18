import { Field, ID, Entity } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { Task } from './task';
import { myConnection } from '../database';
import { SqlDataProvider, ManyToMany } from '@exogee/graphweaver-sql';

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
	provider: new SqlDataProvider(() => Tag, myConnection),
})
export class Tag {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@ManyToMany(() => [Task], { relatedField: 'tags', nullable: true })
	tasks?: Task[];
}
