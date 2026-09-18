import { RelationshipField, ID, Entity, graphweaverMetadata } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { User } from './user';
import { Tag } from './tag';
import { myConnection } from '../database';
import { Field, ManyToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

export enum Priority {
	HIGH = 'HIGH',
	MEDIUM = 'MEDIUM',
	LOW = 'LOW',
}

const acl: AccessControlList<Task, AuthorizationContext> = {
	LIGHT_SIDE: {
		all: {
			// Here we are applying column level security to prevent access to the "priority" column, by default all fields are allowed
			fieldRestrictions: ['priority'],
			// Next, we are applying row level security to only allow access to tasks that belong to the user
			rowFilter: (context) => ({ userId: context.user?.id }),
		},
	},
	DARK_SIDE: {
		// Dark side user role can perform all operations on any task
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
	provider: new SqlDataProvider(() => Task, myConnection),
	adminUIOptions: {
		summaryField: 'description',
	},
})
export class Task {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@Field(() => Boolean, { column: 'completed' })
	isCompleted!: boolean;

	@Field(() => String)
	userId!: string;

	// User is served by the REST provider, not this database, so this stays a plain
	// @RelationshipField -- core resolves it through that provider using the userId above.
	@RelationshipField<Task>(() => User, { id: 'userId', nullable: true })
	user?: User;

	@ManyToMany(() => [Tag], {
		relatedField: 'tasks',
		through: { table: 'task_tags', joinColumn: 'task_id', inverseJoinColumn: 'tag_id' },
	})
	tags!: Tag[];

	@Field(() => Priority, { nullable: true })
	priority?: Priority;

	@Field(() => String, { nullable: true })
	slug(task: Task) {
		return `${task.id}:${task.description}`;
	}
}
