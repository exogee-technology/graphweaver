import { createEventbriteEventResolver } from './event';
import { createEventbriteOrderResolver } from './order';

export const eventbriteEvent: any =
	process.env.EVENTBRITE_ACCESS_TOKEN &&
	process.env.EVENTBRITE_ORG_ID &&
	createEventbriteEventResolver(process.env.EVENTBRITE_ACCESS_TOKEN, process.env.EVENTBRITE_ORG_ID);

export const eventbriteOrder: any =
	process.env.EVENTBRITE_ACCESS_TOKEN &&
	process.env.EVENTBRITE_ORG_ID &&
	createEventbriteOrderResolver(process.env.EVENTBRITE_ACCESS_TOKEN, process.env.EVENTBRITE_ORG_ID);
