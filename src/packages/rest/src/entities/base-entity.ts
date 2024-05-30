import { RelationshipType } from '@exogee/graphweaver';

export type Relationship<T> = {
	entity: () => T;
	type: RelationshipType;
	underlyingFieldName?: string;
	linkEntityAttributes?: {
		name?: string;
		from?: string;
		to?: string;
	};
	navigationPropertyName?: string;
};

export type RelationshipMap<T> = Map<string, Relationship<T>>;

export class BaseEntity {
	public id: string | number;
	public dataEntity: any;

	constructor(dataEntity: any) {
		this.dataEntity = dataEntity;
		this.id = dataEntity.id;
	}

	public isReference(_: string, dataField: any) {
		return (dataField.fieldName as string).endsWith('Id') ? true : false;
	}

	public isCollection(fieldName: string, dataField: any) {
		return Array.isArray(dataField.fieldName);
	}
}
