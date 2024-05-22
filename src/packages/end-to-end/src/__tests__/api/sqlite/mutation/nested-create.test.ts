import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album, Artist } from '../../../../types';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

describe('nested create', () => {
	beforeEach(resetDatabase);

	test('should create an album and an artist', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(gql`
				mutation CreateAlbum($input: AlbumInsertInput!) {
					createAlbum(input: $input) {
						id
						artist {
							id
							name
						}
					}
				}
			`)
			.variables({ input: { artist: { name: 'string' }, title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
		expect(data?.createAlbum?.artist?.id).toBe('276');
		expect(data?.createAlbum?.artist?.name).toBe('string');
	});

	test('should create an artist and an album', async () => {
		const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
			.mutate(gql`
				mutation CreateArtist($input: ArtistInsertInput!) {
					createArtist(input: $input) {
						id
						albums {
							id
							title
						}
					}
				}
			`)
			.variables({ input: { albums: [{ title: 'string' }], name: 'string' } })
			.expectNoErrors();

		expect(data?.createArtist?.id).toBe('276');
		expect(data?.createArtist?.albums?.[0]?.id).toBe('348');
		expect(data?.createArtist?.albums?.[0]?.title).toBe('string');
	});

	test('should update an artist and create an album', async () => {
		const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
			.mutate(gql`
				mutation UpdateArtist($input: ArtistUpdateInput!) {
					updateArtist(input: $input) {
						id
						albums {
							id
							title
						}
					}
				}
			`)
			.variables({ input: { albums: [{ title: 'string' }], id: '1' } })
			.expectNoErrors();

		expect(data?.updateArtist?.id).toBe('1');
		expect(data?.updateArtist?.albums?.map((album) => album.id)).toContain('348');
		expect(data?.updateArtist?.albums?.map((album) => album.title)).toContain('string');
	});
});
