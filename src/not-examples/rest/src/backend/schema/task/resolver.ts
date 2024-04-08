import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Task as OrmTask } from '../../entities';
import { Task } from './entity';
import { myConnection } from '../../database';

@Resolver((of) => Task)
export class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, myConnection)
) {}
