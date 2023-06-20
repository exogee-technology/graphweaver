import {
	BaseLoaders,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	FieldsByTypeName,
	GraphQLEntity,
	Hook,
	HookRegister,
	ReadHookParams,
	RelationshipField,
	ResolveTree,
} from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root, registerEnumType } from 'type-graphql';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { Task as OrmTask, Priority } from '../../entities';
import { User } from '../user';
import { Tag } from '../tag';
import { Roles } from '../..';

type ReadHook = ReadHookParams<Task, AuthorizationContext>;
type CreateOrUpdateHook = CreateOrUpdateHookParams<Task, AuthorizationContext>;
type DeleteHook = DeleteHookParams<Task, AuthorizationContext>;

const acl: AccessControlList<Task, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ user: { id: context.user?.id } }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

registerEnumType(Priority, {
	name: 'Priority',
	valuesConfig: {
		HIGH: {
			description: 'HIGH',
		},
		MEDIUM: {
			description: 'MEDIUM',
		},
		LOW: {
			description: 'LOW',
		},
	},
});

const preventLightSideAccess = (
	authContext: AuthorizationContext,
	requestedFields: ResolveTree | { [str: string]: ResolveTree },
	preventedColumn: string
) => {
	if (
		authContext.user?.roles.includes(Roles.LIGHT_SIDE) &&
		Object.keys(requestedFields).includes(preventedColumn)
	) {
		throw new Error(
			`Column Level Security: You don't have access to this field '${preventedColumn}'`
		);
	}
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

	@Field(() => Priority, { nullable: true })
	priority?: Priority;

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
		preventLightSideAccess(params.context, params.fields['Task'], 'priority');
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
