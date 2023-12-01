import { createProvider } from '@exogee/graphweaver-helpers';

import { EventbriteOrder } from './entity';
import { EventbriteOrderDataEntity } from './data-entity';
import { eventbriteClient } from '../../client';

export interface Context {
	client: ReturnType<typeof eventbriteClient>;
}

export const createEventbriteOrderProvider = (token: string, organizationId: string) =>
	createProvider<EventbriteOrder, Context, EventbriteOrderDataEntity>({
		backendId: 'Eventbrite',
		dataEntity: () => EventbriteOrderDataEntity,
		init: async () => ({
			client: eventbriteClient(token, organizationId),
		}),
		read: async ({ client }, filter, pagination) => {
			if (pagination) console.warn('Pagination is not supported yet by graphweaver-eventbrite');
			if (filter?.id) return (await client.listOrders()).find((order) => order.id === filter.id);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error @todo not sure why it's not ok with filter.email
			if (filter?.email)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error @todo not sure why it's not ok with filter.email
				return await client.listOrdersByEmail(filter.email);
			return await client.listOrders();
		},
	});
