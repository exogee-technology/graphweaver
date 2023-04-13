import {
	AuthorizedBaseFunctions,
	createBaseResolver,
	Hook,
	HookRegister,
	HookParams,
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
	async beforeRead(params: Partial<HookParams<Task>>): Promise<Partial<HookParams<Task>>> {
		return {
			...params,
			args: {
				...(params?.args ? params.args : {}),
				filter: {
					...(params?.args?.filter ? params.args.filter : {}),
					people: {
						id: 4,
					},
				},
			},
		};
	}

	@Hook(HookRegister.AFTER_READ)
	async afterRead(params: Partial<HookParams<Task>>): Promise<Partial<HookParams<Task>>> {
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
}
