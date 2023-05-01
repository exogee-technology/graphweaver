import { BaseLoaders, GraphQLEntity, RelationshipField } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { AccessControlList, ApplyAccessControlList } from '@exogee/graphweaver-rls';

import { Task as OrmTask } from '../../entities';
import { Person } from '../person';
import { Context } from '../../';
import { Tag } from '../tag';

const acl: AccessControlList<Task, Context> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ people: { id: context.user.id } }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
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

	@RelationshipField(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag;
}
