import { AuthResolver } from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';

export const resolvers = [AuthResolver, UserResolver, TaskResolver, TagResolver];
