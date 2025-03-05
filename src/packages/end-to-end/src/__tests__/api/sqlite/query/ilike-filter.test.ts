import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';

type Album = {
	albumId: number;
	title: string;
	artist: {
		artistId: number;
		name: string;
	};
};

describe('ilike operator handling', () => {
	test('should resolve $ilike to $like', async () => {
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
					title_ilike: 'The %'
				},
			})
			.expectNoErrors();

		expect(data?.albums).toHaveLength(30);

        const likeData = await request<{ albums: Album[] }>(config.baseUrl)
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
					title_like: 'The %'
				},
			})
			.expectNoErrors();

		expect(likeData.data?.albums).toHaveLength(30);
	});
});
