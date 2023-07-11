import { GraphQLEntity, RelationshipField } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { Tag as OrmTag } from '../../entities';
import { Task } from '../task';

const acl: AccessControlList<Tag, AuthorizationContext> = {
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

	// Decorator, Generic Type, return type function, relationship field options (keyof D b/c this is the id of the related entity)
	@RelationshipField<Task>(() => [Task], { relatedField: 'tags' })
	tasks!: Task[];
}
