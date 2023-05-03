import { GraphQLEntity, RelationshipField } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { User } from '../user';

@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;
}
