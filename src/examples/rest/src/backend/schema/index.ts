import {
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
} from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';

export const resolvers = [
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
	UserResolver,
	TaskResolver,
	TagResolver,
];
