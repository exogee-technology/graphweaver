import { BaseContext as ApolloBaseContext, ApolloServerPlugin } from '@apollo/server';
import { Span, Tracer } from '@opentelemetry/api';
import { GraphQLID, GraphQLResolveInfo, GraphQLScalarType, Source } from 'graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { ComplexityEstimator } from 'graphql-query-complexity';
import { EntityMetadata } from './metadata';
import {
	CellFormatOptions,
	DetailPanelInputComponent,
	DetailPanelInputComponentOption,
} from './decorators';

export type { Instrumentation } from '@opentelemetry/instrumentation';
export type { GraphQLResolveInfo } from 'graphql';
export type { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';

export type BaseContext = object;

export const ID = GraphQLID;

export interface TraceOptions {
	span: Span;
	tracer: Tracer;
}

export enum Sort {
	ASC = 'ASC',
	DESC = 'DESC',
}

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

export enum AggregationType {
	COUNT = 'COUNT',
}

export interface AggregationResult {
	count?: number;
}

// D = Data entity returned from the datastore
export interface BackendProvider<D> {
	// This is used for query splitting, so we know where to break your
	// queries when you query across data sources.
	readonly backendId: string;

	// Optional, used for display purposes in the Admin UI, deafults to backendId
	// if not specified.
	readonly backendDisplayName?: string;

	entityType?: new () => D;

	find(
		filter: Filter<D>,
		pagination?: PaginationOptions,
		entityMetadata?: EntityMetadata
	): Promise<D[]>;
	findOne(filter: Filter<D>, entityMetadata?: EntityMetadata): Promise<D | null>;
	findByRelatedId(
		entity: { new (): D },
		relatedField: string,
		relatedIds: readonly string[],
		filter?: Filter<D>
	): Promise<D[]>;
	updateOne(id: string | number, updateArgs: Partial<D>): Promise<D>;
	updateMany(entities: Partial<D>[]): Promise<D[]>;
	createOne(entity: Partial<D>): Promise<D>;
	createMany(entities: Partial<D>[]): Promise<D[]>;
	// This is an optional method that can be implemented if the backend supports saving open telemetry traces.
	// This method should not have the TraceMethod decorator applied to it.
	createTraces?(entities: Partial<D>[]): Promise<D[]>;
	createOrUpdateMany(entities: Partial<D>[]): Promise<D[]>;
	deleteOne(filter: Filter<D>): Promise<boolean>;
	// Optional deleteMany
	deleteMany?(filter: Filter<D>): Promise<boolean>;

	// Optional, allows the resolver to start a transaction
	withTransaction?: <T>(callback: () => Promise<T>) => Promise<T>;

	// Optional. Queried to get foreign key values from fields for relationship fields to
	// allow the GraphQL entities to work completely at the GQL level.
	foreignKeyForRelationshipField?(field: FieldMetadata<any, D>, dataEntity: D): string | number;

	// Optional, tells dataloader to cap pages at this size.
	readonly maxDataLoaderBatchSize?: number;

	// Optional, called during supported aggregation operations when your provider declares support via backendProviderConfig.supportedAggregationTypes
	aggregate?(
		filter: Filter<D> | undefined,
		requestedAggregations: Set<AggregationType>
	): Promise<AggregationResult>;

	backendProviderConfig?: BackendProviderConfig;

	/**
	 * @deprecated The method should not be used and will be removed in the future. Use `apolloPluginManager.addPlugin` instead.
	 */
	apolloPlugins?: ApolloServerPlugin<ApolloBaseContext>[];
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
	isAggregate?: boolean;
}

export interface DeleteHookParams<G, TContext = BaseContext> extends HookParams<G, TContext> {
	args: { filter: Filter<G> };
}

export interface DeleteManyHookParams<G, TContext = BaseContext> extends HookParams<G, TContext> {
	args: { filter: Filter<G> };
}

export enum AdminUIFilterType {
	DATE_TIME_RANGE = 'DATE_TIME_RANGE',
	DATE_RANGE = 'DATE_RANGE',
	ENUM = 'ENUM',

	/** Default for numbers - shows simple numeric input */
	NUMERIC = 'NUMERIC',

	/** Shows a range to filter by a range from and to a number. */
	NUMERIC_RANGE = 'NUMERIC_RANGE',
	RELATIONSHIP = 'RELATIONSHIP',
	TEXT = 'TEXT',
	BOOLEAN = 'BOOLEAN',
	DROP_DOWN_TEXT = 'DROP_DOWN_TEXT',
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
	filter?: boolean;
	pagination?: boolean;
	orderBy?: boolean;
	supportedAggregationTypes?: Set<AggregationType>;
	// Default is 'find', which will call the find method on the provider with a filter like `{ id_in: ['1', '2'] }`.
	// If you specify 'findOne', it will repeatedly call the findOne method on the provider with a filter like `{ id: '1' }`.
	idListLoadingMethod?: 'find' | 'findOne';
	supportsPseudoCursorPagination?: boolean;
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
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;

export type GetTypeFunction = (type?: void) => TypeValue;

export type Complexity = ComplexityEstimator | number;

export interface FieldMetadata<G = unknown, D = unknown> {
	adminUIOptions?: {
		hideInTable?: boolean;
		hideInFilterBar?: boolean;
		hideInDetailForm?: boolean;
		readonly?: boolean;
		fieldForDetailPanelNavigationId?: boolean;
		filterType?: AdminUIFilterType;
		filterOptions?: Record<string, unknown>;
		detailPanelInputComponent?: DetailPanelInputComponentOption | DetailPanelInputComponent;
		format?: CellFormatOptions;
	};
	apiOptions?: {
		excludeFromBuiltInWriteOperations?: boolean;
	};
	target: { new (...args: any[]): G };
	name: string;
	getType: GetTypeFunction;
	relationshipInfo?: {
		relatedField?: string;
		id?: string | bigint | ((dataEntity: D) => string | number | bigint | undefined);
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

	// Add custom field directives to this field
	directives?: Record<string, any>;
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
	trace?: TraceOptions;
};

export type Resolver<TArgs = any, TContext = BaseContext, TResult = unknown> = ({
	args,
	context,
	fields,
	trace,
}: ResolverOptions<TArgs, TContext>) => Promise<TResult>;

export enum GraphweaverRequestEvent {
	OnRequest = 'ON_REQUEST',
}
export type GraphweaverPluginNextFunction<T = unknown> = (
	event: GraphweaverRequestEvent,
	next: GraphweaverPluginNextFunction<T>
) => Promise<T>;

export type GraphweaverPlugin<T = unknown> = {
	name: string;
	event: GraphweaverRequestEvent;
	next: GraphweaverPluginNextFunction<T>;
};
