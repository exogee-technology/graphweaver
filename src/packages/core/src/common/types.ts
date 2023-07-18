import { registerEnumType } from 'type-graphql';
import { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo } from 'graphql';
import { ApolloServerPlugin, BaseContext as ApolloBaseContext } from '@apollo/server';

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

export const TypeMap: { [key: string]: any } = {};

registerEnumType(Sort, {
	name: 'Sort',
});

// TODO: When implementing multi-sort columns, Order By has to have its own order so a Record won't do
// (Ordered Array-like is more important than Set-like )
export type OrderByOptions = Record<string, Sort>;

export type PaginationOptions = {
	orderBy: OrderByOptions;
	offset: number;
	limit: number;
};

export type FilterEntity<G> = {
	[K in keyof G]?: G[K] extends (...args: any[]) => Promise<infer C>
		? Filter<C>
		: G[K] extends Promise<infer C>
		? Filter<C>
		: Filter<G[K]>;
};

export type FilterTopLevelProperties<G> = {
	_and?: Filter<G>[];
	_or?: Filter<G>[];
	_not?: Filter<G>[];
};

// G is the root GraphQL entity
// C is a child GraphQL entity
export type Filter<G> = {
	id?: string | number; // Optional id property
} & (
	| FilterEntity<G>
	| FilterTopLevelProperties<G>
	| (FilterEntity<G> & FilterTopLevelProperties<G>)
);

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
	getRelatedEntityId(entity: any, relatedIdField: string): string;
	isCollection(entity: any): boolean;

	// Optional, allows the resolver to start a transaction
	withTransaction?: <T>(callback: () => Promise<T>) => Promise<T>;

	// Optional, tells dataloader to cap pages at this size.
	readonly maxDataLoaderBatchSize?: number;

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

export interface GraphqlEntityType<G, D> {
	name: string; // note this is the built-in ES6 class.name attribute
	typeName?: string;
	fromBackendEntity?(entity: D): G | null;
}

export enum AdminUIFilterType {
	DATE_RANGE = 'DATE_RANGE',
	ENUM = 'ENUM',
	NUMERIC = 'NUMERIC',
	RELATIONSHIP = 'RELATIONSHIP',
	TEXT = 'TEXT',
}

export type AdminUISettingsType = {
	fields?: {
		[x: string]: {
			filter?: {
				hide: true;
			};
		};
	};
};

export enum RelationshipType {
	MANY_TO_ONE = 'MANY_TO_ONE',
	MANY_TO_MANY = 'MANY_TO_MANY',
	ONE_TO_MANY = 'ONE_TO_MANY',
}
