import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

type Album = {
	albumId: number;
	title: string;
	artist: {
		artistId: number;
		name: string;
	};
};

type Artist = {
	artistId: number;
	name: string;
	albums: Album[];
};

describe('nested create', () => {
	beforeEach(resetDatabase);

	test('should create an album and an artist', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(gql`
				mutation CreateAlbum($input: AlbumInsertInput!) {
					createAlbum(input: $input) {
						albumId
						artist {
							artistId
							name
						}
					}
				}
			`)
			.variables({ input: { artist: { name: 'string' }, title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.albumId).toBe('348');
		expect(data?.createAlbum?.artist?.artistId).toBe('276');
		expect(data?.createAlbum?.artist?.name).toBe('string');
	});

	test('should create an artist and an album', async () => {
		const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
			.mutate(gql`
				mutation CreateArtist($input: ArtistInsertInput!) {
					createArtist(input: $input) {
						artistId
						albums {
							albumId
							title
						}
					}
				}
			`)
			.variables({ input: { albums: [{ title: 'string' }], name: 'string' } })
			.expectNoErrors();

		expect(data?.createArtist?.artistId).toBe('276');
		expect(data?.createArtist?.albums?.[0]?.albumId).toBe('348');
		expect(data?.createArtist?.albums?.[0]?.title).toBe('string');
	});

	test('should update an artist and create an album', async () => {
		const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
			.mutate(gql`
				mutation UpdateArtist($input: ArtistUpdateInput!) {
					updateArtist(input: $input) {
						artistId
						albums {
							albumId
							title
						}
					}
				}
			`)
			.variables({ input: { albums: [{ title: 'string' }], artistId: '1' } })
			.expectNoErrors();

		expect(data?.updateArtist?.artistId).toBe('1');
		expect(data?.updateArtist?.albums?.map((album) => album.albumId)).toContain('348');
		expect(data?.updateArtist?.albums?.map((album) => album.title)).toContain('string');
	});
});
