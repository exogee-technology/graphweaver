import request from 'supertest-graphql';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
import {
	Artist,
	Album,
	Playlist,
	CREATE_ARTIST,
	CREATE_ALBUM,
	CREATE_PLAYLIST,
	DELETE_ARTIST,
	DELETE_ALBUM,
	DELETE_PLAYLIST,
	GET_ALBUMS,
} from '../../shared';

describe('delete mutations', () => {
	beforeAll(resetDatabase);
	afterAll(resetDatabase);

	test('should create then delete an artist', async () => {
		// Create
		const { data: createData } = await request<{ createArtist: Artist }>(config.baseUrl)
			.mutate(CREATE_ARTIST)
			.variables({ input: { artistId: '276', name: 'To Delete' } })
			.expectNoErrors();

		expect(createData?.createArtist?.artistId).toBe('276');

		// Delete
		const { data: deleteData } = await request<{ deleteArtist: boolean }>(config.baseUrl)
			.mutate(DELETE_ARTIST)
			.variables({ filter: { artistId: '276' } })
			.expectNoErrors();

		expect(deleteData?.deleteArtist).toBe(true);
	});

	test('should create then delete an album', async () => {
		// Create
		const { data: createData } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(CREATE_ALBUM)
			.variables({ input: { albumId: '348', title: 'To Delete', artist: { artistId: 1 } } })
			.expectNoErrors();

		expect(createData?.createAlbum?.albumId).toBe('348');

		// Delete
		const { data: deleteData } = await request<{ deleteAlbum: boolean }>(config.baseUrl)
			.mutate(DELETE_ALBUM)
			.variables({ filter: { albumId: '348' } })
			.expectNoErrors();

		expect(deleteData?.deleteAlbum).toBe(true);
	});

	test('should create then delete a playlist', async () => {
		// Create
		const { data: createData } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
			.mutate(CREATE_PLAYLIST)
			.variables({ input: { playlistId: '19', name: 'To Delete' } })
			.expectNoErrors();

		expect(createData?.createPlaylist?.playlistId).toBe('19');

		// Delete
		const { data: deleteData } = await request<{ deletePlaylist: boolean }>(config.baseUrl)
			.mutate(DELETE_PLAYLIST)
			.variables({ filter: { playlistId: '19' } })
			.expectNoErrors();

		expect(deleteData?.deletePlaylist).toBe(true);
	});

	test('should have unchanged album count after create and delete', async () => {
		// Get initial count
		const { data: before } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(GET_ALBUMS)
			.expectNoErrors();

		const initialCount = before?.albums?.length ?? 0;
		expect(initialCount).toBeGreaterThan(0);

		// Create
		const { data: createData } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(CREATE_ALBUM)
			.variables({ input: { albumId: '349', title: 'Temporary', artist: { artistId: 1 } } })
			.expectNoErrors();

		expect(createData?.createAlbum?.albumId).toBe('349');

		// Delete
		await request<{ deleteAlbum: boolean }>(config.baseUrl)
			.mutate(DELETE_ALBUM)
			.variables({ filter: { albumId: '349' } })
			.expectNoErrors();

		// Verify count restored
		const { data: after } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(GET_ALBUMS)
			.expectNoErrors();

		expect(after?.albums).toHaveLength(initialCount);
	});
});
