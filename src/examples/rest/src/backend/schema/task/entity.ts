import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { AccessControlList, ApplyAccessControlList } from '@exogee/graphweaver-rls';

import { Task as OrmTask } from '../../entities';
import { Person } from '../person';
import { Context } from '../../';

const acl: AccessControlList<Task, Context> = {
	Everyone: {
		// All user role can perform operations on tasks
		all: true,
	},
};

@ApplyAccessControlList(acl)
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
}
