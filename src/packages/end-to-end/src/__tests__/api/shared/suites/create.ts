import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import { config } from '../../../../config';
import {
	Artist,
	Album,
	Playlist,
	CREATE_ARTIST,
	CREATE_ARTIST_WITH_ALBUMS,
	CREATE_ALBUM,
	CREATE_ALBUM_WITH_NESTED_ARTIST,
	CREATE_PLAYLIST,
	CREATE_PLAYLIST_WITH_TRACKS,
} from '..';
import { DialectOptions, setupDialect } from './dialect';

export const createSuite = (options: DialectOptions) => {
	describe('create mutations', () => {
		const dialect = setupDialect(options);

		test('should create a standalone artist', async () => {
			const artistId = dialect.nextId('artist');

			const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
				.mutate(CREATE_ARTIST)
				.variables({ input: { ...dialect.primaryKey('artistId', artistId), name: 'Test Artist' } })
				.expectNoErrors();

			expect(data?.createArtist?.artistId).toBe(artistId);
			expect(data?.createArtist?.name).toBe('Test Artist');
		});

		test('should create an album with existing artist FK (ManyToOne)', async () => {
			const albumId = dialect.nextId('album');

			const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
				.mutate(CREATE_ALBUM)
				.variables({
					input: {
						...dialect.primaryKey('albumId', albumId),
						title: 'Test Album',
						artist: { artistId: 1 },
					},
				})
				.expectNoErrors();

			expect(data?.createAlbum?.albumId).toBe(albumId);
			expect(data?.createAlbum?.title).toBe('Test Album');
		});

		test('should create an album with nested new artist (ManyToOne)', async () => {
			const albumId = dialect.nextId('album');
			const artistId = dialect.nextId('artist');

			const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
				.mutate(CREATE_ALBUM_WITH_NESTED_ARTIST)
				.variables({
					input: {
						...dialect.primaryKey('albumId', albumId),
						title: 'Test Album Two',
						artist: { ...dialect.primaryKey('artistId', artistId), name: 'New Artist' },
					},
				})
				.expectNoErrors();

			expect(data?.createAlbum?.albumId).toBe(albumId);
			expect(data?.createAlbum?.artist?.artistId).toBe(artistId);
			expect(data?.createAlbum?.artist?.name).toBe('New Artist');
		});

		test('should create an artist with nested albums (OneToMany)', async () => {
			const artistId = dialect.nextId('artist');
			const albumId = dialect.nextId('album');

			const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
				.mutate(CREATE_ARTIST_WITH_ALBUMS)
				.variables({
					input: {
						...dialect.primaryKey('artistId', artistId),
						name: 'Test Artist',
						albums: [{ ...dialect.primaryKey('albumId', albumId), title: 'Album One' }],
					},
				})
				.expectNoErrors();

			expect(data?.createArtist?.artistId).toBe(artistId);
			expect(data?.createArtist?.albums?.[0]?.albumId).toBe(albumId);
			expect(data?.createArtist?.albums?.[0]?.title).toBe('Album One');
		});

		test('should create a standalone playlist', async () => {
			const playlistId = dialect.nextId('playlist');

			const { data } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
				.mutate(CREATE_PLAYLIST)
				.variables({
					input: { ...dialect.primaryKey('playlistId', playlistId), name: 'Test Playlist' },
				})
				.expectNoErrors();

			expect(data?.createPlaylist?.playlistId).toBe(playlistId);
			expect(data?.createPlaylist?.name).toBe('Test Playlist');
		});

		test('should create a playlist with existing tracks (ManyToMany)', async () => {
			const playlistId = dialect.nextId('playlist');

			const { data } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
				.mutate(CREATE_PLAYLIST_WITH_TRACKS)
				.variables({
					input: {
						...dialect.primaryKey('playlistId', playlistId),
						name: 'Test Playlist',
						tracks: [{ trackId: '1' }, { trackId: '2' }],
					},
				})
				.expectNoErrors();

			expect(data?.createPlaylist?.playlistId).toBe(playlistId);
			expect(data?.createPlaylist?.name).toBe('Test Playlist');
			expect(data?.createPlaylist?.tracks).toHaveLength(2);
			expect(data?.createPlaylist?.tracks?.map((t) => t.trackId)).toContain('1');
			expect(data?.createPlaylist?.tracks?.map((t) => t.trackId)).toContain('2');
		});
	});
};
