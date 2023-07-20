import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album, Artist } from '../../../types';
import { config } from '../../../config';
import { resetDatabase } from '../../../utils';

describe('nested create', () => {
	beforeEach(resetDatabase);

	test('should create an album and an artist', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(
				gql`
					mutation CreateAlbum($data: AlbumInsertInput!) {
						createAlbum(data: $data) {
							id
							artist {
								id
								name
							}
						}
					}
				`
			)
			.variables({ data: { artist: { name: 'string' }, title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
		expect(data?.createAlbum?.artist?.id).toBe('276');
		expect(data?.createAlbum?.artist?.name).toBe('string');
	});

	test.skip('should create an artist and an album', async () => {
		const { data } = await request<{ createAlbum: Artist }>(config.baseUrl)
			.mutate(
				gql`
					mutation CreateArtist($data: ArtistInsertInput!) {
						createArtist(data: $data) {
							id
							albums {
								id
								title
							}
						}
					}
				`
			)
			.variables({ data: { albums: [{ title: 'string' }], name: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
		expect(data?.createAlbum?.albums?.[0]?.id).toBe('276');
		expect(data?.createAlbum?.albums?.[0]?.title).toBe('string');
	});

	test('should update an artist and create an album', async () => {
		const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
			.mutate(
				gql`
					mutation UpdateArtist($data: ArtistCreateOrUpdateInput!) {
						updateArtist(data: $data) {
							id
							albums {
								id
								title
							}
						}
					}
				`
			)
			.variables({ data: { albums: [{ title: 'string' }], id: '1' } })
			.expectNoErrors();

		expect(data?.updateArtist?.id).toBe('1');
		expect(data?.updateArtist?.albums?.map((album) => album.id)).toContain('348');
		expect(data?.updateArtist?.albums?.map((album) => album.title)).toContain('string');
	});
});
