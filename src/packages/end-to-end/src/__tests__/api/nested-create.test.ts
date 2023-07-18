import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../../types';
import { config } from '../../config';
import { resetDatabase } from '../../utils';

describe('basic mutation', () => {
	beforeEach(resetDatabase);

	test('should create an album and an artist', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(
				gql`
					mutation CreateAlbum($data: AlbumInsertInput!) {
						createAlbum(data: $data) {
							id
							ArtistId {
								id
								Name
							}
						}
					}
				`
			)
			.variables({ data: { ArtistId: { Name: 'string' }, Title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
		expect(data?.createAlbum?.ArtistId?.id).toBe('276');
		expect(data?.createAlbum?.ArtistId?.Name).toBe('string');
	});
});
