import { AuthResolver } from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';

// The Function type is the type that Type GraphQL expects
// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: [Function, ...Function[]] = [
	AuthResolver,
	UserResolver,
	TaskResolver,
	TagResolver,
];
