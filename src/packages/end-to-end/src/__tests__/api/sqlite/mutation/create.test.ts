import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
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
} from '../../shared';

describe('create mutations', () => {
	beforeEach(resetDatabase);

	test('should create a standalone artist', async () => {
		const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
			.mutate(CREATE_ARTIST)
			.variables({ input: { name: 'Test Artist' } })
			.expectNoErrors();

		expect(data?.createArtist?.artistId).toBe('276');
		expect(data?.createArtist?.name).toBe('Test Artist');
	});

	test('should create an album with existing artist FK', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(CREATE_ALBUM)
			.variables({ input: { title: 'Test Album', artist: { artistId: 1 } } })
			.expectNoErrors();

		expect(data?.createAlbum?.albumId).toBe('348');
		expect(data?.createAlbum?.title).toBe('Test Album');
	});

	test('should create an album with nested new artist (ManyToOne)', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(CREATE_ALBUM_WITH_NESTED_ARTIST)
			.variables({ input: { title: 'Test Album', artist: { name: 'New Artist' } } })
			.expectNoErrors();

		expect(data?.createAlbum?.albumId).toBe('348');
		expect(data?.createAlbum?.artist?.artistId).toBe('276');
		expect(data?.createAlbum?.artist?.name).toBe('New Artist');
	});

	test('should create an artist with nested albums (OneToMany)', async () => {
		const { data } = await request<{ createArtist: Artist }>(config.baseUrl)
			.mutate(CREATE_ARTIST_WITH_ALBUMS)
			.variables({ input: { name: 'Test Artist', albums: [{ title: 'Album One' }] } })
			.expectNoErrors();

		expect(data?.createArtist?.artistId).toBe('276');
		expect(data?.createArtist?.albums?.[0]?.albumId).toBe('348');
		expect(data?.createArtist?.albums?.[0]?.title).toBe('Album One');
	});

	test('should create a standalone playlist', async () => {
		const { data } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
			.mutate(CREATE_PLAYLIST)
			.variables({ input: { name: 'Test Playlist' } })
			.expectNoErrors();

		expect(data?.createPlaylist?.playlistId).toBe('19');
		expect(data?.createPlaylist?.name).toBe('Test Playlist');
	});

	test('should create a playlist with existing tracks (ManyToMany)', async () => {
		const { data } = await request<{ createPlaylist: Playlist }>(config.baseUrl)
			.mutate(CREATE_PLAYLIST_WITH_TRACKS)
			.variables({
				input: {
					name: 'Test Playlist',
					tracks: [{ trackId: '1' }, { trackId: '2' }],
				},
			})
			.expectNoErrors();

		expect(data?.createPlaylist?.playlistId).toBe('19');
		expect(data?.createPlaylist?.name).toBe('Test Playlist');
		expect(data?.createPlaylist?.tracks).toHaveLength(2);
		expect(data?.createPlaylist?.tracks?.map((t) => t.trackId)).toContain('1');
		expect(data?.createPlaylist?.tracks?.map((t) => t.trackId)).toContain('2');
	});
});
