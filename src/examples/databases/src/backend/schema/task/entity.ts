import { GraphQLEntity, RelationshipField, Field, ID, ObjectType, Root } from '@exogee/graphweaver';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

import { Task as OrmTask } from '../../entities';
import { User } from '../user';

@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@Field(() => Boolean)
	isCompleted!: boolean;

	// Example of a field resolver using a json type
	@Field(() => GraphQLJSON)
	meta(@Root() task: Task) {
		return {
			id: task.id,
			description: task.description,
		};
	}

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;
}
