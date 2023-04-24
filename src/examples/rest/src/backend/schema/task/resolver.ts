import {
	createBaseResolver,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	Hook,
	HookRegister,
	ReadHookParams,
} from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { AuthorizedBaseResolver } from '@exogee/graphweaver-rls';
import { Resolver } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { Task } from './entity';
import { Context } from '../../';

type ReadHook = ReadHookParams<Task, Context>;
type CreateOrUpdateHook = CreateOrUpdateHookParams<Task, Context>;
type DeleteHook = DeleteHookParams<Task, Context>;

@Resolver((of) => Task)
@AuthorizedBaseResolver('Task')
export class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, 'my-sql')
) {
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
