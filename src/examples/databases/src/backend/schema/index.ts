import { UserResolver } from './user';
import { TaskResolver } from './task';

// The Function type is the type that Type GraphQL expects
// eslint-disable-next-line @typescript-eslint/ban-types
export const resolvers: [Function, ...Function[]] = [UserResolver, TaskResolver];
