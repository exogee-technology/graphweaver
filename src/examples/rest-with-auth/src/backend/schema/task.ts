import { RelationshipField, Field, ID, Entity, graphweaverMetadata } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Task as OrmTask, Priority } from '../entities';
import { User } from './user';
import { Tag } from './tag';
import { myConnection } from '../database';

const acl: AccessControlList<Task, AuthorizationContext> = {
	LIGHT_SIDE: {
		all: {
			// Here we are applying column level security to prevent access to the "priority" column, by default all fields are allowed
			fieldRestrictions: ['priority'],
			// Next, we are applying row level security to only allow access to tasks that belong to the user
			rowFilter: (context) => ({ user: { id: context.user?.id } }),
		},
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

graphweaverMetadata.collectEnumInformation({
	name: 'Priority',
	target: Priority,
});

@ApplyMultiFactorAuthentication<Task>(() => ({
	Everyone: {
		// all users must provide a password mfa when writing data
		Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
	},
}))
@ApplyAccessControlList(acl)
@Entity<Task>('Task', {
	provider: new MikroBackendProvider(OrmTask, myConnection),
	adminUIOptions: {
		summaryField: 'description',
	},
})
export class Task {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@Field(() => Boolean)
	isCompleted!: boolean;

	@RelationshipField<OrmTask>(() => User, { id: 'userId', nullable: true })
	user?: User;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];

	@Field(() => Priority, { nullable: true })
	priority?: Priority;

	@Field(() => String, { nullable: true })
	slug(task: Task) {
		return `${task.id}:${task.description}`;
	}
}
