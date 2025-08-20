import 'reflect-metadata';

import * as dotenv from 'dotenv';
dotenv.config({
	path: `.env.${(process.env.NODE_ENV || 'development').toLowerCase()}`,
}); // TODO: The path to .env file in pnpm workspaces seems to use the workspace package.json path. Need to ensure it uses the local version (if required)

export * from './provider/index.js';
export * from './entities/index.js';
export * from './decorators/index.js';
export * from './database.js';
export * from './types/index.js';
export * from './utils/authentication-context.js';
export * from './plugins/index.js';
export * from './introspection/index.js';

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
	PrimaryKey,
	QueryFlag,
	QueryOrder,
	Reference,
	ReferenceKind,
	UniqueConstraintViolationException,
	Utils,
	wrap,
} from '@mikro-orm/core';
