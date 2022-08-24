import { PaginationOptions } from './common/types';
declare class QueryManagerImplementation {
    find: <T>({ entityName, filter, pagination, }: {
        entityName: string;
        filter: Partial<T>;
        pagination: PaginationOptions;
    }) => Promise<any[]>;
}
export declare const QueryManager: QueryManagerImplementation;
export {};
