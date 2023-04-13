import {
	AfterHookParams,
	AuthorizedBaseFunctions,
	createBaseResolver,
	BeforeHookParams,
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
	constructor() {
		super();
		this.hookManager.registerBeforeRead(this.beforeRead);
		this.hookManager.registerAfterRead(this.afterRead);
	}

	async beforeRead({ args }: BeforeHookParams<Task>) {
		return {
			filter: {
				...(args?.filter ? args.filter : {}),
				people: {
					id: 4,
				},
			},
		};
	}

	async afterRead({ entities }: AfterHookParams<Task>) {
		return (entities || []).map((task) => {
			if (task) {
				task.description = task.description + ' and crush the resistance!';
				return task;
			}
			return null;
		});
	}
}
