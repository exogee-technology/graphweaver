import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
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

	static async onBeforeRead(args: any) {
		console.log('onBeforeRead', args);
	}

	static async onAfterRead(args: any) {
		console.log('onAfterRead', args);
	}
}
