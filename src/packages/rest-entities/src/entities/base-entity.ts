import { BaseDataEntity } from '@exogee/base-resolver';
import { isArray } from 'lodash';

export enum RelationshipType {
	MANY_TO_ONE = 'MANY_TO_ONE',
	MANY_TO_MANY = 'MANY_TO_MANY',
	ONE_TO_MANY = 'ONE_TO_MANY'
}

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

export class BaseEntity implements BaseDataEntity {
	public dataEntity: any;
	
	public isReference(_: string, dataField: any) {
		return (dataField.fieldName as string).endsWith('Id') ? true : false;
	}

	public isCollection(fieldName: string, dataField: any) {
		return isArray(dataField.fieldName);
	}
}
