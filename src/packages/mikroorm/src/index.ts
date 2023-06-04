import 'reflect-metadata';

import * as dotenv from 'dotenv';
dotenv.config({
	path: `.env.${(process.env.NODE_ENV || 'development').toLowerCase()}`,
}); // TODO: The path to .env file in pnpm workspaces seems to use the workspace package.json path. Need to ensure it uses the local version (if required)

export * from './base-resolver';
export * from './entities';
export * from './decorators';
export * from './database';
export * from './types';
export * from './utils/authentication-context';
export * from './plugins';

// Re-export from Mikro so things that depend on database entities can access helpers such as
// Reference.isReference().
export type {
	AnyEntity,
	ChangeSet,
	EntityData,
	EntityName,
	EventArgs,
	EventSubscriber,
	FilterQuery,
	FlushEventArgs,
	Loaded,
	QueryOrderMap,
} from '@mikro-orm/core';
export type { LoadedReference } from '@mikro-orm/core';
export {
	ChangeSetType,
	Collection,
	DatabaseObjectNotFoundException,
	EntityManager,
	EntityRepository,
	LockMode,
	PrimaryKeyType,
	QueryFlag,
	QueryOrder,
	Reference,
	ReferenceType,
	Subscriber,
	UniqueConstraintViolationException,
	Utils,
	wrap,
} from '@mikro-orm/core';
