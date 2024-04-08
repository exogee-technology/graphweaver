import { BaseDataEntity } from '@exogee/graphweaver';

export class CategoryDataEntity implements BaseDataEntity {
	id!: string;

	title: string;

	isCollection() {
		return false;
	}
	isReference() {
		return false;
	}
}
