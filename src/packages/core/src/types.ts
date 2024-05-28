import { ApolloServerPlugin, BaseContext as ApolloBaseContext } from '@apollo/server';
import { ComplexityEstimator } from 'graphql-query-complexity';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo, GraphQLScalarType, Source } from 'graphql';

import { graphweaverMetadata } from './metadata';

export type { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';
export type { GraphQLResolveInfo } from 'graphql';

export interface BaseContext {}

export enum Sort {
	ASC = 'asc',
	DESC = 'desc',
}

graphweaverMetadata.collectEnumInformation({
	name: 'Sort',
	target: Sort,
});

// TODO: When implementing multi-sort columns, Order By has to have its own order so a Record won't do
// (Ordered Array-like is more important than Set-like )
export type OrderByOptions = Record<string, Sort>;

export type PaginationOptions = {
	orderBy: OrderByOptions;
	offset: number;
	limit: number;
};

export type BaseOperator = 'ne' | 'notnull' | 'null';
export type ArrayOperator = 'in' | 'nin';
export type StringOperator = 'like' | 'ilike';
export type NumericOperator = 'gt' | 'gte' | 'lt' | 'lte';

// In English, this says:
//   If the value in the field is a string, then apply the String Operators from above.
//   Else if the value in the field is a number, bigint or Date then apply the Numeric Operators from above.
//   Else apply only the Base Operators and Array Operators from above
export type FilterWithOperators<G> = {
	[K in keyof G as G[K] extends string
		? `${K & string}_${BaseOperator | ArrayOperator | StringOperator}`
		: G[K] extends number | bigint | Date
			? `${K & string}_${BaseOperator | ArrayOperator | NumericOperator}`
			: `${K & string}_${BaseOperator | ArrayOperator}`]?: FilterValue<G[K]>;
};

export type FilterValue<T> = T | T[];

export type FilterEntity<G> = {
	[K in keyof G]?: G[K] extends (...args: any[]) => Promise<infer C>
		? Filter<C> // Functions remains the same
		: G[K] extends Promise<infer C>
			? Filter<C> // Promises remains the same
			: Partial<G[K]>; // Other types
};

// ❗ There's also a hard coded list just below this. If you're updating this type you need to update that list too.
export type FilterTopLevelProperties<G> = {
	_and?: Filter<G>[];
	_or?: Filter<G>[];
	_not?: Filter<G>[];
};

// ❗ This is used by the permissions system, so if you update the above, then update this list too.
const topLevelFilterProperties = new Set(['_and', '_or', '_not']);
export const isTopLevelFilterProperty = (key: string) => topLevelFilterProperties.has(key);

export type Filter<G> = FilterEntity<G> & FilterTopLevelProperties<G> & FilterWithOperators<G>;

export interface GraphQLArgs<G> {
	items?: Partial<G>[];
	filter?: Filter<G>;
	pagination?: PaginationOptions;
}

// D = Data entity returned from the datastore
export interface BackendProvider<D> {
	// This is used for query splitting, so we know where to break your
	// queries when you query across data sources.
	readonly backendId: string;

	entityType?: new () => D;

	find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any
	): Promise<D[]>;
	findOne(filter: Filter<D>): Promise<D | null>;
	findByRelatedId(
		entity: any,
		relatedField: string,
		relatedIds: readonly string[],
		filter?: Filter<D>
	): Promise<D[]>;
	updateOne(id: string | number, updateArgs: Partial<D>): Promise<D>;
	updateMany(entities: Partial<D>[]): Promise<D[]>;
	createOne(entity: Partial<D>): Promise<D>;
	createMany(entities: Partial<D>[]): Promise<D[]>;
	createOrUpdateMany(entities: Partial<D>[]): Promise<D[]>;
	deleteOne(filter: Filter<D>): Promise<boolean>;
	// Optional deleteMany
	deleteMany?(filter: Filter<D>): Promise<boolean>;

	// Optional, allows the resolver to start a transaction
	withTransaction?: <T>(callback: () => Promise<T>) => Promise<T>;

	// Optional. Queried to get foriegn key values from fields for relationship fields to
	// allow the GraphQL entities to work completely at the GQL level.
	foreignKeyForRelationshipField?(field: FieldMetadata<any, D>, dataEntity: D): string | number;

	// Optional, tells dataloader to cap pages at this size.
	readonly maxDataLoaderBatchSize?: number;

	backendProviderConfig?: BackendProviderConfig;
	plugins?: ApolloServerPlugin<ApolloBaseContext>[];
}

// G = GraphQL entity
// A = Args type
// TContext = GraphQL Context
export interface HookParams<G, TContext = BaseContext> {
	context: TContext;
	transactional: boolean;
	fields?: ResolveTree;
	entities?: (G | null)[];
	deleted?: boolean; // Used by a delete operation to indicate if successful
}

export interface CreateOrUpdateHookParams<G, TContext = BaseContext>
	extends HookParams<G, TContext> {
	args: { items: Partial<G>[] };
}

export interface ReadHookParams<G, TContext = BaseContext> extends HookParams<G, TContext> {
	args: { filter?: Filter<G>; pagination?: PaginationOptions };
}

export interface DeleteHookParams<G, TContext = BaseContext> extends HookParams<G, TContext> {
	args: { filter: Filter<G> };
}

export interface DeleteManyHookParams<G, TContext = BaseContext> extends HookParams<G, TContext> {
	args: { filter: Filter<G> };
}

export enum AdminUIFilterType {
	DATE_RANGE = 'DATE_RANGE',
	ENUM = 'ENUM',
	NUMERIC = 'NUMERIC',
	RELATIONSHIP = 'RELATIONSHIP',
	TEXT = 'TEXT',
	BOOLEAN = 'BOOLEAN',
}

export type AdminUIEntitySettings<G> = {
	defaultFilter?: Filter<G>;
	hideFromDisplay?: boolean;
	hideFromFilterBar?: boolean;
};

export type AdminUISettingsType<G> = {
	fields?: {
		[x: string]: {
			hideFromDisplay?: boolean;
			hideFromFilterBar?: boolean;
		};
	};
	entity?: AdminUIEntitySettings<G>;
};

export enum RelationshipType {
	MANY_TO_ONE = 'MANY_TO_ONE',
	MANY_TO_MANY = 'MANY_TO_MANY',
	ONE_TO_MANY = 'ONE_TO_MANY',
}

export interface BackendProviderConfig {
	filter: {
		root: boolean;
		parentByChild: boolean;
		childByChild: boolean;
	};
	pagination: {
		root: boolean;
		offset: boolean;
		limit: boolean;
	};
	orderBy: {
		root: boolean;
	};
	sort: {
		root: boolean;
	};
}

export type Constructor<T extends object, Arguments extends unknown[] = any[]> = new (
	...arguments_: Arguments
) => T;

export type ClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<
	T,
	Arguments
> & {
	prototype: T;
};

// We want TypeValues to be able to just be generic Functions as well.
// eslint-disable-next-line @typescript-eslint/ban-types
export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;

export type GetTypeFunction = (type?: void) => TypeValue;

export type Complexity = ComplexityEstimator | number;

export interface FieldMetadata<G = unknown, D = unknown> {
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		readonly?: boolean;
	};
	apiOptions?: {
		excludeFromBuiltInWriteOperations?: boolean;
	};
	target: { new (...args: any[]): G };
	name: string;
	getType: GetTypeFunction;
	relationshipInfo?: {
		relatedField?: string;
		id?: (string | number) | ((dataEntity: D) => string | number | undefined);
	};
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;

	// This marks the field as read only in both the API and the admin UI.
	// This will supersede any other read only settings.
	readonly?: boolean;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;

	// This can be used by any plugin to store additional information
	// namespace your key to avoid conflicts
	// See the `@MediaField` decorator for an example
	additionalInformation?: Record<string, unknown>;
}

export type AuthChecker<TContextType extends object = object, TRoleType = string> = (
	context: TContextType,
	roles: TRoleType[]
) => boolean | Promise<boolean>;

export type ResolverOptions<TArgs = any, TContext = BaseContext, TSource = Source> = {
	source: TSource;
	args: TArgs;
	context: TContext;
	fields: ResolveTree;
	info: GraphQLResolveInfo;
};

export type Resolver<TArgs = any, TContext = BaseContext, TResult = unknown> = ({
	args,
	context,
	fields,
}: ResolverOptions<TArgs, TContext>) => TResult;
