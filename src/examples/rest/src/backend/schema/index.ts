import {
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
	PasskeyAuthResolver,
} from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';

export const resolvers = [
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
	PasskeyAuthResolver,
	UserResolver,
	TaskResolver,
	TagResolver,
];
