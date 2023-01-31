import { getMetadataStorage, ObjectType } from 'type-graphql';
import { FieldMetadata as TypeGraphQLFieldMetadata } from 'type-graphql/dist/metadata/definitions';

import { AccessControlList } from '.';

const metadata = getMetadataStorage();

export type DataEntity<T> = {
	[x in keyof T]: T[x];
};

export type GraphQLEntityConstructor<T> = {
	new (dataEntity: T): GraphQLEntity<T>;
};

export type FieldMetadata = TypeGraphQLFieldMetadata;

export interface BaseDataEntity {
	isCollection: (fieldName: string, dataField: any) => boolean;
	isReference: (fieldName: string, dataField: any) => boolean;
}

export const AclMap = new Map<string, AccessControlList<any>>();

@ObjectType()
export class GraphQLEntity<T> {
	constructor(public dataEntity: T) {}

	static fromBackendEntity<T, G>(this: new (dataEntity: T) => G, dataEntity: T) {
		if (dataEntity === undefined || dataEntity === null) return null;

		const entity = new this(dataEntity);

		metadata.fields
			.filter((field) => field.target === this)
			.forEach((field) => {
				const dataField = dataEntity?.[field.name as keyof T];

				if (
					typeof dataField !== 'undefined' &&
					!(dataEntity as unknown as BaseDataEntity).isCollection?.(field.name, dataField) &&
					!(dataEntity as unknown as BaseDataEntity).isReference?.(field.name, dataField) &&
					typeof (entity as any)[field.name] !== 'function'
				)
					// @todo: Can't figure out how to infer this type correctly, but this is what we want to do.
					(entity as any)[field.name] = dataField;
			});

		return entity;
	}
}
