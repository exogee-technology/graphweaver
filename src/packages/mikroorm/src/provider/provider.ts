import type {
	BackendProvider,
	PaginationOptions,
	Filter,
	BackendProviderConfig,
	FieldMetadata,
	AggregationResult,
	TraceOptions,
	GraphweaverRequestEvent,
	GraphweaverPluginNextFunction,
	EntityMetadata,
} from '@exogee/graphweaver';
import { TraceMethod, traceSync, trace as startTrace, graphweaverMetadata, Sort, AggregationType } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import {
	AutoPath,
	LoadStrategy,
	PopulateHint,
	Reference,
	RequestContext,
	sql,
} from '@mikro-orm/core';
import { pluginManager, apolloPluginManager } from '@exogee/graphweaver-server';

import {
	LockMode,
	QueryFlag,
	ReferenceKind,
	ConnectionManager,
	externalIdFieldMap,
	AnyEntity,
	IsolationLevel,
	ConnectionOptions,
	connectToDatabase,
	DatabaseType,
} from '..';

import { OptimisticLockError } from '../utils/errors';
import { assign } from './assign';