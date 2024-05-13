import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext, graphweaverMetadata } from '.';

export type DataEntity<T> = {
	[x in keyof T]: T[x];
};

export interface GraphQLEntityConstructor<G extends GraphQLEntity<D>, D extends BaseDataEntity> {
	new (dataEntity: D): G;
}

export interface BaseDataEntity {
	id: string | number;
	isCollection: (fieldName: string, dataField: any) => boolean;
	isReference: (fieldName: string, dataField: any) => boolean;
}

export class GraphQLEntity<D extends BaseDataEntity> {
	public id: string | number;
	static serialize?: (options: { value: unknown }) => unknown;
	static deserialize?: (options: { value: unknown; parent: Source }) => unknown;

	constructor(public dataEntity: D) {
		this.id = dataEntity.id;
	}

	static fromBackendEntity<D extends BaseDataEntity, G extends GraphQLEntity<D>>(
		this: new (dataEntity: D) => G,
		dataEntity: D
	) {
		if (dataEntity === undefined || dataEntity === null) return null;

		const entity = new this(dataEntity);

		const metadata = graphweaverMetadata.getEntityByName(this.name);
		if (!metadata) throw new Error(`Could not locate metadata for the '${this.name}' entity`);

		for (const field of Object.values(metadata.fields)) {
			const dataField = dataEntity?.[field.name as keyof D];

			if (
				typeof dataField !== 'undefined' &&
				!dataEntity.isCollection?.(field.name, dataField) &&
				!dataEntity.isReference?.(field.name, dataField) &&
				typeof (entity as Record<string, any>)[field.name] !== 'function'
			) {
				(entity as Record<string, any>)[field.name] = dataField;
			}
		}

		return entity;
	}
}
