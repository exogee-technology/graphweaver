import request from 'supertest-graphql';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
import { Artist, Album, CREATE_MANY_ARTISTS, CREATE_MANY_ALBUMS, GET_ARTISTS, GET_ALBUMS } from '../../shared';

describe('createMany mutations', () => {
	beforeEach(resetDatabase);

	test('should create multiple artists', async () => {
		const { data: before } = await request<{ artists: Artist[] }>(config.baseUrl)
			.query(GET_ARTISTS)
			.expectNoErrors();

		const response = await request<{ createArtists: Artist[] }>(config.baseUrl)
			.mutate(CREATE_MANY_ARTISTS)
			.variables({ input: [{ name: 'Artist One' }, { name: 'Artist Two' }] })
			.expectNoErrors();

		expect(response.data?.createArtists).toHaveLength(2);
		expect(response.data?.createArtists?.[0]?.name).toBe('Artist One');
		expect(response.data?.createArtists?.[1]?.name).toBe('Artist Two');

		const { data: after } = await request<{ artists: Artist[] }>(config.baseUrl)
			.query(GET_ARTISTS)
			.expectNoErrors();

		expect(after?.artists).toHaveLength(2 + (before?.artists?.length ?? 0));
	});

	test('should create multiple albums with existing artist FK', async () => {
		const { data: before } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(GET_ALBUMS)
			.expectNoErrors();

		const response = await request<{ createAlbums: Album[] }>(config.baseUrl)
			.mutate(CREATE_MANY_ALBUMS)
			.variables({
				input: [
					{ title: 'Album One', artist: { artistId: 1 } },
					{ title: 'Album Two', artist: { artistId: 1 } },
				],
			})
			.expectNoErrors();

		expect(response.data?.createAlbums).toHaveLength(2);
		expect(response.data?.createAlbums?.[0]?.title).toBe('Album One');
		expect(response.data?.createAlbums?.[1]?.title).toBe('Album Two');

		const { data: after } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(GET_ALBUMS)
			.expectNoErrors();

		expect(after?.albums).toHaveLength(2 + (before?.albums?.length ?? 0));
	});
});
