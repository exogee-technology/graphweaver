import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
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

	@Field(() => User, { nullable: true })
	async user() {
		if (!this.dataEntity.userId) return null;

		return User.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: User,
				id: this.dataEntity.userId,
			})
		);
	}
}
