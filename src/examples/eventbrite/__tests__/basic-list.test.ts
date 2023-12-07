import 'reflect-metadata';
import assert from 'assert';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';

import { eventbriteEvent } from '../src/backend/schema';

describe('Mailchimp Integration', () => {
	test('should get one mailing list', async () => {
		const graphweaver = new Graphweaver({
			resolvers: [eventbriteEvent],
		});

		const response = await graphweaver.server.executeOperation({
			query: gql`
				query AdminUIEventListPage($filter: EventsListFilter, $pagination: EventsPaginationInput) {
					result: events(filter: $filter, pagination: $pagination) {
						id
						status
						title
						url
						summary
						eventStart
						eventEnd
						imageUrl
						contactName
						contactUrl
						place
						address
						latitude
						longitude
						created
						changed
						published
						isFree
						__typename
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.result).toHaveLength(1);
		expect(response.body.singleResult.data?.result[0].id).not.toBeNull();
	});
});
