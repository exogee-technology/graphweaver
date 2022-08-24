import { FieldMetadata as TypeGraphQLFieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { AccessControlList } from '.';
export declare type DataEntity<T> = {
    [x in keyof T]: T[x];
};
export declare type GraphQLEntityConstructor<T> = {
    new (dataEntity: T): GraphQLEntity<T>;
};
export declare type FieldMetadata = TypeGraphQLFieldMetadata;
export interface BaseDataEntity {
    isCollection: (fieldName: string, dataField: any) => boolean;
    isReference: (fieldName: string, dataField: any) => boolean;
}
export declare const AclMap: Map<string, AccessControlList<any>>;
export declare class GraphQLEntity<T> {
    dataEntity: T;
    constructor(dataEntity: T);
    static fromBackendEntity<T, G>(this: new (dataEntity: T) => G, dataEntity: T): G;
}
