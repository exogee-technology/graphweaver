export * from './task';
export * from './user';

import { Task } from './task';
import { User } from './user';

export const mikroOrmEntities = [Task, User];
