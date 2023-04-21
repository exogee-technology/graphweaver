import { registerEnumType } from 'type-graphql';
import { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo } from 'graphql';

export type WithId = {
	id: string;
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

// Consumers will extend the base context type
export type AuthorizationContext = {
	roles?: string[];
};

export enum AccessType {
	Read = 'Read',
	Create = 'Create',
	Update = 'Update',
	Delete = 'Delete',
}

export const BASE_ROLE_EVERYONE = 'Everyone';

export type AccessControlList<T> = {
	[K in string]?: AccessControlEntry<T>;
};

export interface AccessControlEntry<T> {
	read?: AccessControlValue<T>;
	create?: AccessControlValue<T>;
	update?: AccessControlValue<T>;
	delete?: AccessControlValue<T>;
	write?: AccessControlValue<T>;
	all?: AccessControlValue<T>;
}

export type ConsolidatedAccessControlEntry<T> = {
	[K in AccessType]?: ConsolidatedAccessControlValue<T>;
};

export type AccessControlValue<G> = true | FilterFunction<G>;
export type ConsolidatedAccessControlValue<G> = true | FilterFunction<G>[];
export type FilterFunction<G> = (context: AuthorizationContext) => Filter<G> | Promise<Filter<G>>;

export type Filter<G> = {
	id?: string;
	_and?: Filter<G>[];
	_or?: Filter<G>[];
	_not?: Filter<G>[];
};

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
	updateOne(id: string, updateArgs: Partial<G>): Promise<D>;
	updateMany(entities: (Partial<G> & WithId)[]): Promise<D[]>;
	createOne(entity: Partial<G>): Promise<D>;
	createMany(entities: Partial<G>[]): Promise<D[]>;
	createOrUpdateMany(entities: Partial<G>[]): Promise<D[]>;
	deleteOne(filter: Filter<G>): Promise<boolean>;
	getRelatedEntityId(entity: any, relatedIdField: string): string;
	isCollection(entity: any): boolean;

	// Optional, tells dataloader to cap pages at this size.
	readonly maxDataLoaderBatchSize?: number;
}

// G = GraphQL entity
// A = Args type
// TContext = GraphQL Context
export interface HookParams<G, A, TContext = AuthorizationContext> {
	args: A;
	context: TContext;
	info: GraphQLResolveInfo;
	fields: FieldsByTypeName | { [str: string]: ResolveTree } | undefined;
	entities: (G | null)[];
	deleted: boolean; // Used by a delete operation to indicate if successful
}

export type CreateOrUpdateHookParams<G, TContext = AuthorizationContext> = {
	args: { items: Partial<G>[] };
} & Partial<HookParams<G, { items: Partial<G>[] }, TContext>>;

export type ReadHookParams<G, TContext = AuthorizationContext> = Partial<
	HookParams<G, { filter?: Filter<G>; pagination?: PaginationOptions }, TContext>
>;

export type DeleteHookParams<G, TContext = AuthorizationContext> = Partial<
	HookParams<G, { filter: { id: string } & Filter<G> }, TContext>
>;

export interface GraphqlEntityType<G, D> {
	name: string; // note this is the built-in ES6 class.name attribute
	typeName?: string;
	accessControlList?: AccessControlList<G>;
	fromBackendEntity?(entity: D): G | null;
	mapInputForInsertOrUpdate?(entity: Partial<G>): Partial<G>;
}

export const GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';

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
