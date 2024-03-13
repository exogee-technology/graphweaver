import { getMetadataStorage } from 'type-graphql';
import { FieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import { MetadataStorage } from 'type-graphql/dist/metadata/metadata-storage';

import { BaseDataEntity } from '.';
import { BackendProvider } from './common/types';

export interface EntityMetadata<G, D extends BaseDataEntity> extends ObjectClassMetadata {
	name: string;
	plural: string;
	provider: BackendProvider<D, G>;
	fields: FieldMetadata[];
}

class Metadata {
	private entityMap = new Map<string, EntityMetadata<unknown, any>>();
	private fieldsStore: FieldMetadata[] = [];
	private typeGraphQLMetadata: MetadataStorage;

	constructor() {
		this.typeGraphQLMetadata = getMetadataStorage();
	}

	// get a list of all the entity metadata in the metadata map
	public get entities() {
		return Array.from(this.entityMap.values());
	}

	// get a list of all the entity names in the metadata map
	public get entityNames() {
		return Array.from(this.entityMap.keys());
	}

	// get a list of all the enums in the metadata map
	public get enums() {
		return this.typeGraphQLMetadata.enums;
	}

	// get a list of all the fields in the metadata map
	public get fields() {
		return this.fieldsStore;
	}

	// get the metadata for a specific entity
	public getEntity<G, D extends BaseDataEntity>(name: string): EntityMetadata<G, D> {
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
	public setEntity<G, D extends BaseDataEntity>(entity: EntityMetadata<G, D>) {
		this.entityMap.set(entity.name, entity);
		this.fieldsStore.push(...entity.fields);
	}

	public clear() {
		this.entityMap.clear();
		this.fieldsStore = [];
		this.typeGraphQLMetadata = getMetadataStorage();
	}
}

export const graphweaverMetadata = new Metadata();
