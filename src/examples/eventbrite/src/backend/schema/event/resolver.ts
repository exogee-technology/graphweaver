import { Event as EventbriteEvent } from './entity';
import { EventbriteEventDataEntity } from './data-entity';

import { createBaseResolver, Resolver } from '@exogee/graphweaver';

import { createEventbriteEventProvider } from './provider';

export type EventbriteEventResolver = ReturnType<typeof createEventbriteEventResolver>;

export const createEventbriteEventResolver = (token: string, organizationId: string) => {
	const provider = createEventbriteEventProvider(token, organizationId);

	@Resolver(() => EventbriteEvent)
	class EventbriteEventResolver extends createBaseResolver<
		EventbriteEvent,
		EventbriteEventDataEntity
	>(EventbriteEvent, provider) {}

	return EventbriteEventResolver;
};
