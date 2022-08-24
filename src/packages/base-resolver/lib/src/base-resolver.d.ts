import { TypeValue } from 'type-graphql/dist/decorators/types';
import { EnumMetadata, FieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import type { BackendProvider, GraphqlEntityType } from './common/types';
import { AccessControlList } from './common/types';
export declare const EntityMetadataMap: Map<string, BaseResolverMetadataEntry>;
export interface BaseResolverMetadataEntry {
    provider: BackendProvider<any>;
    entity: ObjectClassMetadata;
    fields: FieldMetadata[];
    enums: EnumMetadata[];
    accessControlList?: AccessControlList<any>;
}
export declare function registerScalarType(scalarType: TypeValue, treatAsType: TypeValue): void;
export declare function createBaseResolver<T, O>(gqlEntityType: GraphqlEntityType<T, O>, provider: BackendProvider<O>): any;
