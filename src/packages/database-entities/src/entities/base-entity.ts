import { BaseDataEntity } from '@exogee/base-resolver';
import { Reference, Utils } from '@mikro-orm/core';

export class BaseEntity implements BaseDataEntity {
	public isReference(_: string, dataField: any) {
		return Reference.isReference<any>(dataField);
	}

	public isCollection(fieldName: string, dataField: any) {
		return Utils.isCollection<any>(dataField);
	}
}
