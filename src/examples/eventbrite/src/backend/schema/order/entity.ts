import { Field, ID, ObjectType, GraphQLEntity, RelationshipField } from '@exogee/graphweaver';

import { EventbriteOrderDataEntity } from '../../entities';

import { Event as EventbriteEvent } from '../event';

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

	@RelationshipField<EventbriteOrder>(() => EventbriteEvent, { id: 'event_id' })
	event!: EventbriteEvent;
}
