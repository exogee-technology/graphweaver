import { createProvider } from '@exogee/graphweaver-helpers';

import { eventbriteClient } from '../../client';
import { Event as EventbriteEvent } from './entity';
import { EventbriteEventDataEntity } from './data-entity';

export interface Context {
	client: ReturnType<typeof eventbriteClient>;
}

export const createEventbriteEventProvider = (token: string, organizationId: string) =>
	createProvider<EventbriteEvent, Context, EventbriteEventDataEntity>({
		backendId: 'Eventbrite',
		dataEntity: () => EventbriteEventDataEntity,
		init: async () => ({
			client: eventbriteClient(token, organizationId),
		}),
		read: async ({ client }, filter, pagination) => {
			if (pagination) console.warn('Pagination is not supported yet by graphweaver-eventbrite');
			const events = await client.listEvents();
			if (filter?.id) return events.find((event) => event.id === filter.id);
			return events;
		},
		search: async ({ client }, query) => {
			const insensitiveQuery = query.toLowerCase();
			const events = await client.listEvents();

			return events.filter(
				(event) =>
					event.name.text.toLowerCase().includes(insensitiveQuery) ||
					event.description.text.toLowerCase().includes(insensitiveQuery)
			);
		},
	});
