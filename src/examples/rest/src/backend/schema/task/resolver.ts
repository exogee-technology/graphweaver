import {
	AuthorizedBaseFunctions,
	createBaseResolver,
	DeleteHookParams,
	Hook,
	HookRegister,
	ReadHookParams,
} from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { Task } from './entity';

@Resolver((of) => Task)
@AuthorizedBaseFunctions()
export class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, 'my-sql')
) {
	@Hook(HookRegister.BEFORE_READ)
	async beforeRead(params: ReadHookParams<Task>): Promise<ReadHookParams<Task>> {
		const filter = params.args?.filter ?? {};
		const newFilter = {
			...filter,
			people: {
				id: 4,
			},
		};
		return {
			...params,
			args: {
				...params.args,
				filter: newFilter,
			},
		};
	}

	@Hook(HookRegister.AFTER_READ)
	async afterRead(params: ReadHookParams<Task>): Promise<ReadHookParams<Task>> {
		const entities = (params.entities || []).map((task) => {
			if (task) {
				task.description = task.description + ' and crush the resistance!';
				return task;
			}
			return null;
		});
		return {
			...params,
			entities,
		};
	}

	@Hook(HookRegister.BEFORE_DELETE)
	async beforeDelete(params: DeleteHookParams<Task>): Promise<DeleteHookParams<Task>> {
		return params;
	}

	@Hook(HookRegister.AFTER_DELETE)
	async afterDelete(params: DeleteHookParams<Task>): Promise<DeleteHookParams<Task>> {
		return params;
	}
}
