import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../types';
import { config } from '../config';
import { resetDatabase } from '../utils';

describe('basic query', () => {
	beforeEach(resetDatabase);

	test('should get albums', async () => {
		const { data } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(
				gql`
					query {
						albums {
							id
						}
					}
				`
			)
			.expectNoErrors();

		expect(data?.albums).toHaveLength(347);
	});
});
