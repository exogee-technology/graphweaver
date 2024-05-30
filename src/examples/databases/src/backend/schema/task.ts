import { RelationshipField, Field, ID, Entity } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

import { Task as OrmTask } from '../entities';
import { User } from './user';
import { myConnection } from '../database';

@Entity('Task', {
	provider: new MikroBackendProvider(OrmTask, myConnection),
})
export class Task {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@Field(() => Boolean)
	isCompleted!: boolean;

	// Example of a field resolver using a json type
	@Field(() => GraphQLJSON, { nullable: true, readonly: true })
	meta(task: Task) {
		return {
			id: task.id,
			description: task.description,
		};
	}

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;
}
