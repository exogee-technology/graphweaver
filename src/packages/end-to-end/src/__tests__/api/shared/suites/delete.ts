import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import { config } from '../../../../config';
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
} from '..';
import { DialectOptions, setupDialect } from './dialect';

export const deleteSuite = (options: DialectOptions) => {
	describe('delete mutations', () => {
		const dialect = setupDialect(options);

		test('should create then delete an artist', async () => {
			const artistId = dialect.nextId('artist');

			const { data: createData } = await request<{ createArtist: Artist }>(config.baseUrl)
				.mutate(CREATE_ARTIST)
				.variables({ input: { ...dialect.primaryKey('artistId', artistId), name: 'To Delete' } })
				.expectNoErrors();

			expect(createData?.createArtist?.artistId).toBe(artistId);

			const { data: deleteData } = await request<{ deleteArtist: boolean }>(config.baseUrl)
				.mutate(DELETE_ARTIST)
				.variables({ filter: { artistId } })
				.expectNoErrors();

			expect(deleteData?.deleteArtist).toBe(true);
		});

		test('should create then delete an album', async () => {
			const albumId = dialect.nextId('album');

			const { data: createData } = await request<{ createAlbum: Album }>(config.baseUrl)
				.mutate(CREATE_ALBUM)
				.variables({
					input: {
						...dialect.primaryKey('albumId', albumId),
						title: 'To Delete',
						artist: { artistId: 1 },
					},
				})
				.expectNoErrors();

			expect(createData?.createAlbum?.albumId).toBe(albumId);

			const { data: deleteData } = await request<{ deleteAlbum: boolean }>(config.baseUrl)
				.mutate(DELETE_ALBUM)
				.variables({ filter: { albumId } })
				.expectNoErrors();

			expect(deleteData?.deleteAlbum).toBe(true);
		});

		test('should create then delete a playlist', async () => {
			const playlistId = dialect.nextId('playlist');

			const { data: createData } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
				.mutate(CREATE_PLAYLIST)
				.variables({
					input: { ...dialect.primaryKey('playlistId', playlistId), name: 'To Delete' },
				})
				.expectNoErrors();

			expect(createData?.createPlaylist?.playlistId).toBe(playlistId);

			const { data: deleteData } = await request<{ deletePlaylist: boolean }>(config.baseUrl)
				.mutate(DELETE_PLAYLIST)
				.variables({ filter: { playlistId } })
				.expectNoErrors();

			expect(deleteData?.deletePlaylist).toBe(true);
		});

		test('should have unchanged album count after create and delete', async () => {
			// Counted rather than hard coded at 347: where a reset is too expensive to run between
			// tests, the rows this file's earlier tests left behind are still there.
			const { data: before } = await request<{ albums: Album[] }>(config.baseUrl)
				.query(GET_ALBUMS)
				.expectNoErrors();

			const initialCount = before?.albums?.length ?? 0;
			expect(initialCount).toBeGreaterThan(0);

			const albumId = dialect.nextId('album');

			await request<{ createAlbum: Album }>(config.baseUrl)
				.mutate(CREATE_ALBUM)
				.variables({
					input: {
						...dialect.primaryKey('albumId', albumId),
						title: 'Temporary',
						artist: { artistId: 1 },
					},
				})
				.expectNoErrors();

			await request<{ deleteAlbum: boolean }>(config.baseUrl)
				.mutate(DELETE_ALBUM)
				.variables({ filter: { albumId } })
				.expectNoErrors();

			const { data: after } = await request<{ albums: Album[] }>(config.baseUrl)
				.query(GET_ALBUMS)
				.expectNoErrors();

			expect(after?.albums).toHaveLength(initialCount);
		});
	});
};
