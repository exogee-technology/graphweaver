import 'reflect-metadata';
import assert from 'assert';
import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';

import { mailingList } from '../src/backend/schema';

describe('Mailchimp Integration', () => {
	test('should get one mailing list', async () => {
		const graphweaver = new Graphweaver({
			resolvers: [mailingList],
		});

		const response = await graphweaver.server.executeOperation({
			query: gql`
				query AdminUIListPage(
					$filter: MailingListsListFilter
					$pagination: MailingListsPaginationInput
				) {
					result: mailingLists(filter: $filter, pagination: $pagination) {
						id
						name
						__typename
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.result).toHaveLength(1);
		expect(response.body.singleResult.data?.result[0].id).toEqual(process.env.MAILCHIMP_LIST_ID);
	});
});
