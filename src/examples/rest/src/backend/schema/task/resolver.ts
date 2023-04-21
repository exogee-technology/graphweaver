import {
	AuthorizedBaseFunctions,
	createBaseResolver,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	Hook,
	HookRegister,
	ReadHookParams,
} from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { Task } from './entity';
import { Context } from '../../types';

type ReadHook = ReadHookParams<Task, Context>;
type CreateOrUpdateHook = CreateOrUpdateHookParams<Task, Context>;
type DeleteHook = DeleteHookParams<Task, Context>;

@Resolver((of) => Task)
@AuthorizedBaseFunctions()
export class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, 'my-sql')
) {
	@Hook(HookRegister.BEFORE_CREATE)
	async beforeCreate(params: CreateOrUpdateHook): Promise<CreateOrUpdateHook> {
		return params;
	}

	@Hook(HookRegister.AFTER_CREATE)
	async afterCreate(params: CreateOrUpdateHook): Promise<CreateOrUpdateHook> {
		return params;
	}

	@Hook(HookRegister.BEFORE_READ)
	async beforeRead(params: ReadHookParams<Task, Context>): Promise<ReadHookParams<Task, Context>> {
		console.log(params.context?.user.id);
		// You can hook into any read here and make changes such as applying a filter
		const filter = params.args?.filter ?? {};
		const userFilter = {
			...filter,
			people: {
				id: params.context?.user.id,
			},
		};
		return {
			...params,
			args: {
				...params.args,
				filter: userFilter,
			},
		};
	}

	@Hook(HookRegister.AFTER_READ)
	async afterRead(params: ReadHook): Promise<ReadHook> {
		// You can hook into any read after the data has been fetched here and make changes to the entities
		// const entities = (params.entities || []).map((task) => {
		// 	if (task) {
		// 		task.description = task.description + ' and crush the resistance!';
		// 		return task;
		// 	}
		// 	return null;
		// });
		return params;
	}

	@Hook(HookRegister.BEFORE_UPDATE)
	async beforeUpdate(params: CreateOrUpdateHook): Promise<CreateOrUpdateHook> {
		return params;
	}

	@Hook(HookRegister.AFTER_UPDATE)
	async afterUpdate(params: CreateOrUpdateHook): Promise<CreateOrUpdateHook> {
		return params;
	}

	@Hook(HookRegister.BEFORE_DELETE)
	async beforeDelete(params: DeleteHook): Promise<DeleteHook> {
		return params;
	}

	@Hook(HookRegister.AFTER_DELETE)
	async afterDelete(params: DeleteHook): Promise<DeleteHook> {
		return params;
	}
}
