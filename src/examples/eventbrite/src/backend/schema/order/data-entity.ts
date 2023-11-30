import { BaseDataEntity } from '@exogee/graphweaver';

export class EventbriteAttendeeDataEntity implements BaseDataEntity {
	id: string;
	profile: {
		name: string;
	};
	barcodes: Array<{
		barcode: string;
	}>;
	isCollection(fieldName: string) {
		return ['barcodes'].includes(fieldName);
	}
	isReference() {
		return false;
	}
}

export class EventbriteOrderDataEntity implements BaseDataEntity {
	id: string;
	email: string;
	status: string;
	name: string;
	event_id: string;
	attendees: Array<EventbriteAttendeeDataEntity>;
	isCollection(fieldName: string) {
		return ['attendees'].includes(fieldName);
	}
	isReference() {
		return false;
	}
}
