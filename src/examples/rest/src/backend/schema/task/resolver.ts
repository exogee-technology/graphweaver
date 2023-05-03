import { createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { Task as OrmTask } from '../../entities';
import { Task } from './entity';
import { Context } from '../../';

@Resolver((of) => Task)
export class TaskResolver extends createBaseResolver<Task, OrmTask>(
	Task,
	new MikroBackendProvider(OrmTask, 'my-sql')
) {}
