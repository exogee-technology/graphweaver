import { getMetadataStorage, ObjectType } from 'type-graphql';
import { FieldMetadata as TypeGraphQLFieldMetadata } from 'type-graphql/dist/metadata/definitions';

import { AdminUISettingsType, BackendProvider, GraphqlEntityType } from '.';

const metadata = getMetadataStorage();

export type DataEntity<T> = {
	[x in keyof T]: T[x];
};

export interface GraphQLEntityConstructor<D extends BaseDataEntity> {
	new (dataEntity: D): GraphQLEntity<D>;
}

export type FieldMetadata = TypeGraphQLFieldMetadata;

export interface BaseDataEntity {
	isCollection: (fieldName: string, dataField: any) => boolean;
	isReference: (fieldName: string, dataField: any) => boolean;
}

// This map is used to store the Admin UI Settings Metadata
export const AdminUISettingsMap = new Map<string, AdminUISettingsType>();

@ObjectType()
export class GraphQLEntity<D extends BaseDataEntity> {
	public id?: string;
	constructor(public dataEntity: D) {}

	static fromBackendEntity<D extends BaseDataEntity, G extends GraphQLEntity<D>>(
		this: new (dataEntity: D) => G,
		dataEntity: D
	) {
		if (dataEntity === undefined || dataEntity === null) return null;

		const entity = new this(dataEntity);

		metadata.fields
			.filter((field) => field.target === this)
			.forEach((field) => {
				const dataField = dataEntity?.[field.name as keyof D];

				if (
					typeof dataField !== 'undefined' &&
					!dataEntity.isCollection?.(field.name, dataField) &&
					!dataEntity.isReference?.(field.name, dataField) &&
					typeof (entity as any)[field.name] !== 'function'
				)
					(entity as any)[field.name] = dataField;
			});

		return entity;
	}
}
