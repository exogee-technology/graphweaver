export declare enum Sort {
    ASC = "asc",
    DESC = "desc"
}
export declare const TypeMap: {
    [key: string]: any;
};
export declare type OrderByOptions = {
    [x: string]: Sort;
};
export declare type PaginationOptions = {
    orderBy: OrderByOptions;
    offset: number;
    limit: number;
};
export declare type AuthorizationContext = {
    roles?: string[];
};
export declare enum AccessType {
    Read = "Read",
    Create = "Create",
    Update = "Update",
    Delete = "Delete"
}
export declare const BASE_ROLE_EVERYONE = "Everyone";
export declare type AccessControlList<T> = {
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
export declare type ConsolidatedAccessControlEntry<T> = {
    [K in AccessType]?: ConsolidatedAccessControlValue<T>;
};
export declare type AccessControlValue<T> = true | QueryFilterFunction<T>;
export declare type ConsolidatedAccessControlValue<T> = true | QueryFilterFunction<T>[];
export declare type QueryFilterFunction<T> = (context: AuthorizationContext) => QueryFilter<T> | Promise<QueryFilter<T>>;
export declare type QueryFilter<T> = any;
export interface BackendProvider<T> {
    readonly backendId: string;
    entityType: new () => T;
    find(filter: any, pagination?: PaginationOptions, additionalOptionsForBackend?: any): Promise<T[]>;
    findOne(filter: any): Promise<T | null>;
    findByRelatedId(entity: any, relatedField: string, relatedIds: readonly string[], filter?: any): Promise<T[]>;
    update(id: string, updateArgs: Partial<T>): Promise<T>;
    updateMany(entities: (Partial<T> & {
        id: string;
    })[]): Promise<T[]>;
    create(entity: Partial<T>): Promise<T>;
    createMany(entities: Partial<T>[]): Promise<T[]>;
    createOrUpdateMany(entities: Partial<T>[]): Promise<T[]>;
    delete(id: string): Promise<boolean>;
    getRelatedEntityId(entity: any, relatedIdField: string): string;
    isCollection(entity: any): boolean;
}
export interface GraphqlEntityType<T, O> {
    name: string;
    typeName?: string;
    accessControlList?: AccessControlList<T>;
    fromBackendEntity?(entity: O): T;
    mapInputForInsertOrUpdate?(input: any): any;
}
export declare const GENERIC_AUTH_ERROR_MESSAGE = "Forbidden";
