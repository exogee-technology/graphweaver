import {
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
	PasskeyAuthResolver,
	ApiKeyAuthResolver,
} from './auth';
import { UserResolver } from './user';
import { TaskResolver } from './task';
import { TagResolver } from './tag';
import { FishResolver } from './fish';

export const resolvers = [
	PasswordAuthResolver,
	MagicLinkAuthResolver,
	OneTimePasswordAuthResolver,
	Web3AuthResolver,
	PasskeyAuthResolver,
	ApiKeyAuthResolver,
	UserResolver,
	TaskResolver,
	TagResolver,
	FishResolver,
];
