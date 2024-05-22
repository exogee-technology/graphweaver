import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../../../../types';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

describe('basic filter', () => {
	beforeEach(resetDatabase);

	test('should filter Albums by Artist ID = "Black Sabbath"', async () => {
		const { data } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(gql`
				query Albums($filter: AlbumsListFilter) {
					albums(filter: $filter) {
						albumId
						title
						artist {
							artistId
							name
						}
					}
				}
			`)
			.variables({
				filter: {
					artist: {
						name: 'Black Sabbath',
					},
				},
			})
			.expectNoErrors();

		expect(data?.albums).toHaveLength(2);
	});
});
