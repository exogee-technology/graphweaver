import gql from 'graphql-tag';
import request from 'supertest-graphql';

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
		try {
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
		} catch (error) {
			console.log(error); // print error so we know what went wrong (instead of just "AggregateError").
			expect(error).toBeUndefined(); // fail the test;
		}
	});

	test('should update an artist and create an album', async () => {
		try {
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
				.variables({ input: { albums: [{ title: 'string' }], artistId: '276' } });
			console.log('DATA', data);

			expect(data?.updateArtist?.artistId).toBe('276');
			expect(data?.updateArtist?.albums?.map((album) => album.albumId)).toContain('348');
			expect(data?.updateArtist?.albums?.map((album) => album.title)).toContain('string');
		} catch (error) {
			//console.log(error); // print error so we know what went wrong (instead of just "AggregateError").
			expect(error).toBeUndefined(); // fail the test;
		}
	});

	test('should create an artist and an album', async () => {
		try {
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
		} catch (error) {
			//console.log(error); // print error so we know what went wrong (instead of just "AggregateError").
			expect(error).toBeUndefined(); // fail the test;
		}
	});
});
