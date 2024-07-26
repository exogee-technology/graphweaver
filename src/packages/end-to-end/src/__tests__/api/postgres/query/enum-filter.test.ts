import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';

type Invoice = {
	albumId: number;
	title: string;
	artist: {
		artistId: number;
		name: string;
	};
};

describe('enum filter', () => {
	test('should filter Invoices by PaymentStatus', async () => {
		const { data } = await request<{ invoices: Invoice[] }>(config.baseUrl)
			.query(gql`
				query Invoices($filter: InvoicesListFilter) {
					invoices(filter: $filter) {
						invoiceId
						paymentStatus
					}
				}
			`)
			.variables({
				filter: {
					paymentStatus: 'PARTIALLY-PAID',
				},
			})
			.expectNoErrors();

		expect(data?.invoices).toHaveLength(2);
	});
});
