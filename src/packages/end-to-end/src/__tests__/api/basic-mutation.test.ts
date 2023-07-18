import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../../types';
import { config } from '../../config';
import { resetDatabase } from '../../utils';

describe('basic mutation', () => {
	beforeEach(resetDatabase);

	test('should create an album', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(
				gql`
					mutation CreateAlbum($data: AlbumInsertInput!) {
						createAlbum(data: $data) {
							id
						}
					}
				`
			)
			.variables({ data: { ArtistId: { id: 1 }, Title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
	});
});
