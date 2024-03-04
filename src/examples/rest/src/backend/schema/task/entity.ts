import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLEntity,
	Hook,
	HookRegister,
	ReadHookParams,
	RelationshipField,
	ResolveTree,
	Field,
	ID,
	ObjectType,
	registerEnumType,
	Root,
	SummaryField,
} from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	ApplyMultiFactorAuthentication,
	AuthenticationMethod,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';

import { Task as OrmTask, Priority } from '../../entities';
import { User } from '../user';
import { Tag } from '../tag';
import { Roles } from '../../auth/roles';

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

type TaskField = keyof InstanceType<typeof Task>;

// As an example of column level security
// This prevents users on the light side from accessing the priority column
export const preventLightSideAccess = (
	params: CreateOrUpdateHook | ReadHook,
	requestedFields: ResolveTree | { [str: string]: ResolveTree },
	preventedColumn: TaskField
) => {
	if (
		params.context.user?.roles.includes(Roles.LIGHT_SIDE) &&
		Object.keys(requestedFields ?? {}).includes(preventedColumn)
	) {
		// Filter out the prevented column from the returned entities
		const filteredEntities = params.entities?.map((entity) => {
			const { [preventedColumn]: _, ...rest } = entity;
			return rest;
		});

		return filteredEntities;
	}
	return params.entities;
};

// @ApplyMultiFactorAuthentication<Task>(() => ({
// 	Everyone: {
// 		// all users must provide a password mfa when writing data
// 		Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.WEB3] }],
// 	},
// }))
@ApplyAccessControlList(acl)
@ObjectType('Task')
export class Task extends GraphQLEntity<OrmTask> {
	public dataEntity!: OrmTask;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	description!: string;

	@Field(() => Boolean)
	isCompleted!: boolean;

	@RelationshipField<Task>(() => User, { id: 'userId' })
	user!: User;

	@RelationshipField<Tag>(() => [Tag], { relatedField: 'tasks' })
	tags!: Tag[];

	@Field(() => Priority, { nullable: true })
	priority?: Priority;

	@Field((type) => String, { nullable: true })
	slug(@Root() task: Task) {
		return `${task.id}:${task.description}`;
	}

	// The hooks below are not in use (and are not required when creating an entity)
	// They are included here as an example of how to use them
	@Hook(HookRegister.BEFORE_CREATE)
	async beforeCreate(params: CreateOrUpdateHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.AFTER_CREATE)
	async afterCreate(params: CreateOrUpdateHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.BEFORE_READ)
	async beforeRead(params: ReadHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.AFTER_READ)
	async afterRead(params: ReadHook) {
		// filter the retured data object (entities) out priorty
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.BEFORE_UPDATE)
	async beforeUpdate(params: CreateOrUpdateHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.AFTER_UPDATE)
	async afterUpdate(params: CreateOrUpdateHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.BEFORE_DELETE)
	async beforeDelete(params: DeleteHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
	@Hook(HookRegister.AFTER_DELETE)
	async afterDelete(params: DeleteHook) {
		const filteredEntities = preventLightSideAccess(params, params.fields['Task'], 'priority');
		return { ...params, entities: filteredEntities };
	}
}
