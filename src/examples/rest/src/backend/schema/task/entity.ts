import {
	BaseLoaders,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLEntity,
	Hook,
	HookRegister,
	ReadHookParams,
	RelationshipField,
} from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { AccessControlList, ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Task as OrmTask } from '../../entities';
import { User } from '../user';
import { Context } from '../../';
import { Tag } from '../tag';

type ReadHook = ReadHookParams<Task, Context>;
type CreateOrUpdateHook = CreateOrUpdateHookParams<Task, Context>;
type DeleteHook = DeleteHookParams<Task, Context>;

const acl: AccessControlList<Task, Context> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ user: { id: context.user.id } }),
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

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];

	// The hooks below are not in use (and are not required when creating an entity)
	// They are included here as an example of how to use them
	@Hook(HookRegister.BEFORE_CREATE)
	async beforeCreate(params: CreateOrUpdateHook) {
		return params;
	}
	@Hook(HookRegister.AFTER_CREATE)
	async afterCreate(params: CreateOrUpdateHook) {
		return params;
	}
	@Hook(HookRegister.BEFORE_READ)
	async beforeRead(params: ReadHook) {
		return params;
	}
	@Hook(HookRegister.AFTER_READ)
	async afterRead(params: ReadHook) {
		return params;
	}
	@Hook(HookRegister.BEFORE_UPDATE)
	async beforeUpdate(params: CreateOrUpdateHook) {
		return params;
	}
	@Hook(HookRegister.AFTER_UPDATE)
	async afterUpdate(params: CreateOrUpdateHook) {
		return params;
	}
	@Hook(HookRegister.BEFORE_DELETE)
	async beforeDelete(params: DeleteHook) {
		return params;
	}
	@Hook(HookRegister.AFTER_DELETE)
	async afterDelete(params: DeleteHook) {
		return params;
	}
}
