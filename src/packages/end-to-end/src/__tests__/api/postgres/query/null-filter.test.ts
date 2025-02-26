import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';

describe('null filter', () => {
	test('should filter by Customers with company_null = true', async () => {
		const { data } = await request<{ customers: any }>(config.baseUrl)
			.query(gql`
				query Customers($filter: CustomersListFilter) {
					customers(filter: $filter) {
						customerId
						company
					}
				}
			`)
			.variables({
				filter: {
					company_null: true,
				},
			})
			.expectNoErrors();

		expect(data?.customers).toHaveLength(49);
	});
});
