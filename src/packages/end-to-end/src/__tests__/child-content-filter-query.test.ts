import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../types';
import { config } from '../config';
import { resetDatabase } from '../utils';

describe('child content filter', () => {
	beforeEach(resetDatabase);

	test('should filter Albums by Artist ID = "Black Sabbath"', async () => {
		const { data } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(
				gql`
					query ExampleQuery($filter: AlbumsListFilter) {
						albums(filter: $filter) {
							id
							Title
							ArtistId {
								id
								Name
							}
						}
					}
				`,
				{
					filter: {
						ArtistId: {
							Name: 'Black Sabbath',
						},
					},
				}
			)
			.expectNoErrors();

		expect(data?.albums).toHaveLength(2);
	});
});
