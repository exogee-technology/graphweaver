import { EnumMetadata, FieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';

import { BaseDataEntity, GraphQLEntity } from '.';
import { BackendProvider } from './common/types';

export interface BaseResolverMetadataEntry<D extends BaseDataEntity> {
	provider: BackendProvider<D, GraphQLEntity<D>>;
	entity: ObjectClassMetadata;
	fields: FieldMetadata[];
	enums: EnumMetadata[];
	plural: string;
}

export const EntityMetadataMap = new Map<string, BaseResolverMetadataEntry<any>>();

// Get the meta data for this entity and error check
export const getMetadataForEntity = (name: string) => {
	const meta = EntityMetadataMap.get(name);
	if (!meta) {
		throw new Error(`Unexpected Error: entity not found in metadata map`);
	}
	return meta;
};
