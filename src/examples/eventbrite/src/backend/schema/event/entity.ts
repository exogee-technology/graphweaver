import { GraphQLEntity, Field, ID, ObjectType, Root, registerEnumType } from '@exogee/graphweaver';

import { EventbriteEventDataEntity } from './data-entity';

export enum EventStatus {
	Draft = 'draft',
	Live = 'live',
	Started = 'started',
	Ended = 'ended',
	Completed = 'completed',
	Canceled = 'canceled',
}

registerEnumType(EventStatus, {
	name: 'EventStatus',
	description: 'Status of the event',
});

@ObjectType('Event')
export class Event extends GraphQLEntity<EventbriteEventDataEntity> {
	@Field(() => ID)
	id!: string;

	@Field(() => EventStatus)
	status!: EventStatus;

	@Field(() => String)
	title(@Root() event: Event) {
		return event.dataEntity.name.text;
	}

	@Field(() => String)
	url!: string;

	@Field(() => String)
	summary?: string;

	@Field(() => String)
	eventStart(@Root() event: Event) {
		return event.dataEntity.start.local;
	}

	@Field(() => String, { nullable: true })
	eventEnd(@Root() event: Event) {
		return event.dataEntity.end.local;
	}

	@Field(() => String, { nullable: true })
	imageUrl(@Root() event: Event) {
		return event.dataEntity.logo.url;
	}

	@Field(() => String, { nullable: true })
	contactName(@Root() event: Event) {
		return event.dataEntity.organizer.name;
	}

	@Field(() => String)
	contactUrl(@Root() event: Event) {
		return event.dataEntity.organizer.url;
	}

	@Field(() => String, { nullable: true })
	place(@Root() event: Event) {
		return event.dataEntity.venue?.name;
	}

	@Field(() => String, { nullable: true })
	address(@Root() event: Event) {
		return event.dataEntity.venue?.address.localized_address_display;
	}

	@Field(() => String, { nullable: true })
	latitude(@Root() event: Event) {
		return event.dataEntity.venue?.address.latitude;
	}

	@Field(() => String, { nullable: true })
	longitude(@Root() event: Event) {
		return event.dataEntity.venue?.address.longitude;
	}

	@Field(() => String)
	created!: string;

	@Field(() => String)
	changed!: string;

	@Field(() => String, { nullable: true })
	published?: string;

	@Field(() => Boolean)
	isFree(@Root() event: Event) {
		return event.dataEntity.is_free;
	}
}
