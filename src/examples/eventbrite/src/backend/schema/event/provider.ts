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
			console.log('#######read');
			if (pagination) console.warn('Pagination is not supported yet by graphweaver-eventbrite');
			const events = await client.listEvents();
			try {
				if (filter?.id) return events.find((event) => event.id === filter.id);
				return events;
			} catch (err) {
				console.log('####Errr', err);
			}
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
