import { BaseDataEntity } from '@exogee/graphweaver';

export class EventbriteOrderDataEntity implements BaseDataEntity {
	id: string;
	email: string;
	status: string;
	name: string;
	event_id: string;
	isCollection(fieldName: string) {
		return ['attendees'].includes(fieldName);
	}
	isReference() {
		return false;
	}
}
