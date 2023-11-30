import { createBaseResolver, Resolver } from '@exogee/graphweaver';

import { EventbriteOrder } from './entity';
import { EventbriteOrderDataEntity } from './data-entity';
import { createEventbriteOrderProvider } from './provider';

export const createEventbriteOrderResolver = (token: string, organizationId: string) => {
	const provider = createEventbriteOrderProvider(token, organizationId);

	@Resolver(() => EventbriteOrder)
	class EventbriteOrderResolver extends createBaseResolver<
		EventbriteOrder,
		EventbriteOrderDataEntity
	>(EventbriteOrder, provider) {}

	return {
		provider,
		entity: EventbriteOrder,
		resolver: EventbriteOrderResolver,
	};
};
