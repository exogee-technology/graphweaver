import { ApolloServerPlugin, BaseContext as ApolloBaseContext } from '@apollo/server';
import { ComplexityEstimator } from 'graphql-query-complexity';
import { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo, GraphQLScalarType } from 'graphql';
import { graphweaverMetadata } from '../metadata';

export type { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';
export type { GraphQLResolveInfo } from 'graphql';

export interface BaseContext {}

export type WithId = {
	id: string | number;
};

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

export type IdOperator = 'ne' | 'in' | 'nin' | 'notnull' | 'null';
export type StringOperator = 'ne' | 'in' | 'nin' | 'like' | 'ilike' | 'notnull' | 'null';
export type OtherOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'ne' | 'in' | 'nin' | 'notnull' | 'null';

export type FilterWithOperators<G> = {
	[K in keyof G as K extends 'id'
		? `${K & string}_${IdOperator}`
		: G[K] extends string
			? `${K & string}_${StringOperator}`
			: `${K & string}_${OtherOperator}`]?: FilterValue<G[K]>;
};

export type FilterValue<T> = T | T[];

export type FilterEntity<G> = {
	[K in keyof G]?: G[K] extends (...args: any[]) => Promise<infer C>
		? Filter<C> // Functions remains the same
		: G[K] extends Promise<infer C>
			? Filter<C> // Promises remains the same
			: Partial<G[K]>; // Other types
};

export type FilterTopLevelProperties<G> = {
	_and?: Filter<G>[];
	_or?: Filter<G>[];
	_not?: Filter<G>[];
};

export type Filter<G> = Partial<WithId> &
	FilterEntity<G> &
	FilterTopLevelProperties<G> &
	FilterWithOperators<G>;

export interface GraphQLArgs<G> {
	items?: Partial<G>[];
	filter?: Filter<G>;
	pagination?: PaginationOptions;
}

// D = Data entity returned from the datastore
// G = GraphQL entity
export interface BackendProvider<D, G> {
	// This is used for query splitting, so we know where to break your
	// queries when you query across data sources.
	readonly backendId: string;

	entityType?: new () => D;

	find(
		filter: Filter<G>,
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any
	): Promise<D[]>;
	findOne(filter: Filter<G>): Promise<D | null>;
	findByRelatedId(
		entity: any,
		relatedField: string,
		relatedIds: readonly string[],
		filter?: Filter<G>
	): Promise<D[]>;
	updateOne(id: string | number, updateArgs: Partial<G>): Promise<D>;
	updateMany(entities: (Partial<G> & WithId)[]): Promise<D[]>;
	createOne(entity: Partial<G>): Promise<D>;
	createMany(entities: Partial<G>[]): Promise<D[]>;
	createOrUpdateMany(entities: Partial<G>[]): Promise<D[]>;
	deleteOne(filter: Filter<G>): Promise<boolean>;
	//optional deleteMany
	deleteMany?(filter: Filter<G>): Promise<boolean>;

	getRelatedEntityId(entity: any, relatedIdField: string): string;
	isCollection(entity: unknown): entity is Iterable<unknown & WithId>;

	// Optional, allows the resolver to start a transaction
	withTransaction?: <T>(callback: () => Promise<T>) => Promise<T>;

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
	info: GraphQLResolveInfo;
	transactional: boolean;
	fields?: FieldsByTypeName | { [str: string]: ResolveTree } | undefined;
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

export interface GraphQLEntityType<G, D> {
	name: string; // Note: this is the built-in ES6 class.name attribute
	typeName?: string;
	fromBackendEntity?(entity: D): G | null;
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

export interface FieldMetadata<G> {
	target: G;
	name: string;
	getType: GetTypeFunction;
	description?: string;
	deprecationReason?: string;
	complexity?: Complexity;
	defaultValue?: any;
	nullable?: boolean | 'items' | 'itemsAndList';
	excludeFromFilterType?: boolean;
}
