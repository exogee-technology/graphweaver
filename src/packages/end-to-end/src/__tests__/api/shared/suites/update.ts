import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import { config } from '../../../../config';
import {
	Artist,
	Album,
	Playlist,
	UPDATE_ARTIST,
	UPDATE_ALBUM,
	UPDATE_ARTIST_WITH_ALBUMS,
	UPDATE_PLAYLIST_WITH_TRACKS,
} from '..';
import { DialectOptions, setupDialect } from './dialect';

export const updateSuite = (options: DialectOptions) => {
	describe('update mutations', () => {
		const dialect = setupDialect(options);

		test('should update artist name', async () => {
			const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
				.mutate(UPDATE_ARTIST)
				.variables({ input: { artistId: '1', name: 'Updated Artist' } })
				.expectNoErrors();

			expect(data?.updateArtist?.artistId).toBe('1');
			expect(data?.updateArtist?.name).toBe('Updated Artist');
		});

		test('should update album title', async () => {
			const { data } = await request<{ updateAlbum: Album }>(config.baseUrl)
				.mutate(UPDATE_ALBUM)
				.variables({ input: { albumId: '1', title: 'Updated Album' } })
				.expectNoErrors();

			expect(data?.updateAlbum?.albumId).toBe('1');
			expect(data?.updateAlbum?.title).toBe('Updated Album');
		});

		test('should update artist with nested album create', async () => {
			const albumId = dialect.nextId('album');

			const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
				.mutate(UPDATE_ARTIST_WITH_ALBUMS)
				.variables({
					input: {
						artistId: '275',
						albums: [{ ...dialect.primaryKey('albumId', albumId), title: 'New Album' }],
					},
				})
				.expectNoErrors();

			expect(data?.updateArtist?.artistId).toBe('275');
			expect(data?.updateArtist?.albums?.map((a) => a.albumId)).toContain(albumId);
			expect(data?.updateArtist?.albums?.map((a) => a.title)).toContain('New Album');
		});

		test('should update playlist tracks (ManyToMany)', async () => {
			const { data } = await request<{ updatePlaylist: Playlist }>(config.baseUrl)
				.mutate(UPDATE_PLAYLIST_WITH_TRACKS)
				.variables({
					input: {
						playlistId: '1',
						tracks: [{ trackId: '1' }, { trackId: '2' }],
					},
				})
				.expectNoErrors();

			expect(data?.updatePlaylist?.playlistId).toBe('1');
			expect(data?.updatePlaylist?.tracks).toHaveLength(2);
			expect(data?.updatePlaylist?.tracks?.map((t) => t.trackId)).toContain('1');
			expect(data?.updatePlaylist?.tracks?.map((t) => t.trackId)).toContain('2');
		});
	});
};
