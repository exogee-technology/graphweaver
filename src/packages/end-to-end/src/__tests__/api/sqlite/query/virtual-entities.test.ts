import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

type TotalInvoicesByCustomerResult = {
	customerId: string;
	total: string;
	customer: {
		customerId: string;
		firstName: string;
	};
};

describe('virtual entities', () => {
	beforeEach(resetDatabase);

	test('should get TotalInvoicesByCustomer view results', async () => {
		const { data } = await request<{ totalInvoicesByCustomers: TotalInvoicesByCustomerResult[] }>(
			config.baseUrl
		)
			.query(gql`
				query {
					totalInvoicesByCustomers {
						customerId
						total
						customer {
							customerId
							firstName
						}
					}
				}
			`)
			.expectNoErrors();

		expect(data?.totalInvoicesByCustomers).toHaveLength(59);
		expect(data?.totalInvoicesByCustomers[1]).toEqual({
			customerId: '2',
			total: '37.62',
			customer: {
				customerId: '2',
				firstName: 'Leonie',
			},
		});
	});

	test('should get TotalInvoicesByCustomer filtered view results', async () => {
		const { data } = await request<{ totalInvoicesByCustomers: TotalInvoicesByCustomerResult[] }>(
			config.baseUrl
		)
			.query(gql`
				query {
					totalInvoicesByCustomers(filter: { customerId_in: ["10", "11"] }) {
						customerId
						total
						customer {
							customerId
							firstName
						}
					}
				}
			`)
			.expectNoErrors();

		expect(data?.totalInvoicesByCustomers).toHaveLength(2);
		expect(data?.totalInvoicesByCustomers).toEqual([
			{
				customerId: '10',
				total: '37.62',
				customer: {
					customerId: '10',
					firstName: 'Eduardo',
				},
			},
			{
				customerId: '11',
				total: '37.62',
				customer: {
					customerId: '11',
					firstName: 'Alexandre',
				},
			},
		]);
	});

	test('should get aggregation results', async () => {
		const { data } = await request<{ result: { count: number } }>(config.baseUrl)
			.query(gql`
				query {
					result: totalInvoicesByCustomers_aggregate {
						count
					}
				}
			`)
			.expectNoErrors();

		expect(data).toEqual({ result: { count: 59 } });
	});

	test('should get filtered aggregation results', async () => {
		const { data } = await request<{ result: { count: number } }>(config.baseUrl)
			.query(gql`
				query {
					result: totalInvoicesByCustomers_aggregate(filter: { customerId_in: ["10", "11"] }) {
						count
					}
				}
			`)
			.expectNoErrors();

		expect(data).toEqual({ result: { count: 2 } });
	});
});
