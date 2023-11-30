import {
	Field,
	ID,
	ObjectType,
	Root,
	ExcludeFromFilterType,
	ExcludeFromInputTypes,
	GraphQLEntity,
	RelationshipField,
} from '@exogee/graphweaver';

import { EventbriteOrderDataEntity, EventbriteAttendeeDataEntity } from './data-entity';

import { Event as EventbriteEvent } from '../event';

@ObjectType('EventbriteAttendee')
export class EventbriteAttendee extends GraphQLEntity<EventbriteAttendeeDataEntity> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name(@Root() attendee: EventbriteAttendee): string {
		return attendee.dataEntity.profile.name;
	}

	@Field(() => [String])
	barcodes(@Root() attendee: EventbriteAttendee): Array<string> {
		return attendee.dataEntity.barcodes.map(({ barcode }) => barcode);
	}
}

@ObjectType('EventbriteOrder')
export class EventbriteOrder extends GraphQLEntity<EventbriteOrderDataEntity> {
	dataEntity!: EventbriteOrderDataEntity;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String)
	status!: string;

	@Field(() => String)
	email!: string;

	@Field(() => [EventbriteAttendee])
	@ExcludeFromFilterType()
	@ExcludeFromInputTypes()
	attendees(@Root() order: EventbriteOrder) {
		return order.dataEntity.attendees.map((attendee) =>
			Object.assign(new EventbriteAttendee(attendee), { id: attendee.id })
		);
	}

	@RelationshipField<EventbriteOrder>(() => EventbriteEvent, { id: 'event_id' })
	event!: EventbriteEvent;
}
