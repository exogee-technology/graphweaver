import request from 'supertest-graphql';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
import {
	Artist,
	Album,
	Playlist,
	UPDATE_ARTIST,
	UPDATE_ALBUM,
	UPDATE_ARTIST_WITH_ALBUMS,
	UPDATE_PLAYLIST_WITH_TRACKS,
} from '../../shared';

describe('update mutations', () => {
	beforeAll(resetDatabase);
	afterAll(resetDatabase);

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
		const { data } = await request<{ updateArtist: Artist }>(config.baseUrl)
			.mutate(UPDATE_ARTIST_WITH_ALBUMS)
			.variables({ input: { artistId: '275', albums: [{ albumId: '348', title: 'New Album' }] } })
			.expectNoErrors();

		expect(data?.updateArtist?.artistId).toBe('275');
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
