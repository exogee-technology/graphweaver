import { EnumMetadata, FieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';

import { BaseDataEntity, GraphQLEntity, getMetadataStorage } from '.';
import { BackendProvider } from './common/types';

export interface BaseResolverMetadataEntry<D extends BaseDataEntity> extends ObjectClassMetadata {
	name: string;
	plural: string;
	provider: BackendProvider<D, GraphQLEntity<D>>;
	fields: FieldMetadata[];
}

class Metadata {
	private entityMap = new Map<string, BaseResolverMetadataEntry<any>>();

	// get the metadata for a specific entity
	public getEntity(name: string) {
		const meta = this.entityMap.get(name);
		if (!meta) {
			throw new Error(`Unexpected Error: entity (${name}) not found in metadata map`);
		}
		return meta;
	}

	// check if the metadata map has a specific entity
	public hasEntity(name: string) {
		return this.entityMap.has(name);
	}

	// set the metadata for a specific entity
	public setEntity<D extends BaseDataEntity>(name: string, meta: BaseResolverMetadataEntry<D>) {
		this.entityMap.set(name, meta);
	}

	// get a list of all the entity names in the metadata map
	public get entityNames() {
		return Array.from(this.entityMap.keys());
	}

	// get a list of all the entity metadata in the metadata map
	public get entities() {
		return Array.from(this.entityMap.values());
	}
}

export const graphweaverMetadata = new Metadata();
