import { EventbriteEventResolver, createEventbriteEventResolver } from './event';
import { EventbriteOrderResolver, createEventbriteOrderResolver } from './order';

export const eventbriteEvent: EventbriteEventResolver =
	process.env.EVENTBRITE_ACCESS_TOKEN &&
	process.env.EVENTBRITE_ORG_ID &&
	createEventbriteEventResolver(process.env.EVENTBRITE_ACCESS_TOKEN, process.env.EVENTBRITE_ORG_ID);

export const eventbriteOrder: EventbriteOrderResolver =
	process.env.EVENTBRITE_ACCESS_TOKEN &&
	process.env.EVENTBRITE_ORG_ID &&
	createEventbriteOrderResolver(process.env.EVENTBRITE_ACCESS_TOKEN, process.env.EVENTBRITE_ORG_ID);
