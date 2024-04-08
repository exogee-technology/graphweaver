import { BaseDataEntity } from '@exogee/graphweaver';

export class MailingListDataEntity implements BaseDataEntity {
	id!: string;

	name: string;

	isCollection() {
		return false;
	}
	isReference() {
		return false;
	}
}
