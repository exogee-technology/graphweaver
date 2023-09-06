import { GraphQLEntity, RelationshipField, Field, ID, ObjectType } from '@exogee/graphweaver';

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
	completed!: boolean;

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;
}
