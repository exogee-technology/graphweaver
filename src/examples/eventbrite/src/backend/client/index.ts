import { logger } from '@exogee/logger';
import 'isomorphic-fetch';

const eventbriteFetch = (token: string, path: string) => {
	const url = new URL(path, 'https://www.eventbriteapi.com/');

	const controller = new AbortController();
	setTimeout(() => controller.abort(), 5000);

	return fetch(url.toString(), {
		headers: { Authorization: `Bearer ${token}` },
		signal: controller.signal,
	})
		.then(async (response) => {
			if (!response.ok) throw new Error(await response.text());
			return await response.json();
		})
		.catch((error) => {
			logger.info('Returned an error', error);
			throw error;
		});
};

export const eventbriteClient = (token: string, organizationId: string) => ({
	listEvents: () =>
		eventbriteFetch(
			token,
			`/v3/organizations/${organizationId}/events?expand=organizer,venue`
		).then((result) => (result as any).events),
	listOrdersByEmail: (email: string) =>
		eventbriteFetch(
			token,
			`/v3/organizations/${organizationId}/orders?only_emails=${email}&expand=attendees`
		).then((result) => (result as any).orders),
	listOrders: () =>
		eventbriteFetch(token, `/v3/organizations/${organizationId}/orders?expand=attendees`).then(
			(result) => (result as any).orders
		),
	getEventStructuredContentModules: (eventId: string) =>
		eventbriteFetch(token, `/v3/events/${eventId}/structured_content/?purpose=listing`).then(
			(result) => (result as any).modules
		),
	getEventStructuredContentWidgets: (eventId: string) =>
		eventbriteFetch(token, `/v3/events/${eventId}/structured_content/?purpose=listing`).then(
			(result) => (result as any).widgets
		),
});
