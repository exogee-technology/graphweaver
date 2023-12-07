import { BaseDataEntity } from '@exogee/graphweaver';

export enum MemberStatus {
	subscribed = 'subscribed',
	unsubscribed = 'unsubscribed',
	cleaned = 'cleaned',
	pending = 'pending',
	transactional = 'transactional',
}

export class MemberDataEntity implements BaseDataEntity {
	id!: string;

	email_address: string;

	status!: MemberStatus;

	isCollection() {
		return false;
	}
	isReference() {
		return false;
	}
}
