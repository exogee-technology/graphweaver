import { AfterEventArgs, BaseLoaders, BeforeEventArgs, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { Person } from '../person';

@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;

	@Field(() => Person, { nullable: true })
	async people() {
		if (!this.dataEntity.personId) return null;

		return Person.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: Person,
				id: this.dataEntity.personId,
			})
		);
	}

	static async onBeforeRead({ args, fields, context, info }: BeforeEventArgs<Task>) {
		// Here you can check the fields that were requested in the original query
		// The GraphQL arguments are also available
	}

	static async onAfterRead({ entities }: AfterEventArgs<Task>) {
		entities;
	}
}
