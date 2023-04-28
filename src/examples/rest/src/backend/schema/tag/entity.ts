import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { AccessControlList, ApplyAccessControlList } from '@exogee/graphweaver-rls';

import { Tag as OrmTag } from '../../entities';
import { Context } from '../../';
import { Task } from '../task';

const acl: AccessControlList<Tag, Context> = {
	LIGHT_SIDE: {
		// Users can only read tags
		read: true,
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
};

@ApplyAccessControlList(acl)
@ObjectType('Tag')
export class Tag extends GraphQLEntity<OrmTag> {
	public dataEntity!: OrmTag;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [Task], { nullable: true })
	async tasks(@Root() tag: Tag) {
		const tasks = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Task,
			relatedField: 'tags',
			id: tag.id,
		});

		return tasks.map((task) => Task.fromBackendEntity(task));
	}
}
