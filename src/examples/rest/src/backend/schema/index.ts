import { PasswordAuthResolver, MagicLinkAuthResolver } from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';

export const resolvers = [
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	UserResolver,
	TaskResolver,
	TagResolver,
];
