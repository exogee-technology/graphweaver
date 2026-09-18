import { describe, test } from 'node:test';
import request from 'supertest-graphql';
import { config } from '../../../../config';
import {
	Artist,
	Album,
	CREATE_MANY_ARTISTS,
	CREATE_MANY_ALBUMS,
	DELETE_MANY_ARTISTS,
	DELETE_MANY_ALBUMS,
	GET_ARTISTS,
} from '..';
import { DialectOptions, setupDialect } from './dialect';

export const deleteManySuite = (options: DialectOptions) => {
	describe('deleteMany mutations', () => {
		const dialect = setupDialect(options);

		test('should create then delete multiple artists', async () => {
			const { data: createData } = await request<{ createArtists: Artist[] }>(config.baseUrl)
				.mutate(CREATE_MANY_ARTISTS)
				.variables({
					input: [
						{ ...dialect.primaryKey('artistId', dialect.nextId('artist')), name: 'To Delete One' },
						{ ...dialect.primaryKey('artistId', dialect.nextId('artist')), name: 'To Delete Two' },
					],
				})
				.expectNoErrors();

			expect(createData?.createArtists).toHaveLength(2);

			const ids = createData?.createArtists?.map((a) => a.artistId) ?? [];

			const { data: deleteData } = await request<{ deleteArtists: boolean }>(config.baseUrl)
				.mutate(DELETE_MANY_ARTISTS)
				.variables({ filter: { artistId_in: ids } })
				.expectNoErrors();

			expect(deleteData?.deleteArtists).toBe(true);
		});

		test('should create then delete multiple albums', async () => {
			const { data: createData } = await request<{ createAlbums: Album[] }>(config.baseUrl)
				.mutate(CREATE_MANY_ALBUMS)
				.variables({
					input: [
						{
							...dialect.primaryKey('albumId', dialect.nextId('album')),
							title: 'To Delete One',
							artist: { artistId: 1 },
						},
						{
							...dialect.primaryKey('albumId', dialect.nextId('album')),
							title: 'To Delete Two',
							artist: { artistId: 1 },
						},
					],
				})
				.expectNoErrors();

			expect(createData?.createAlbums).toHaveLength(2);

			const ids = createData?.createAlbums?.map((a) => a.albumId) ?? [];

			const { data: deleteData } = await request<{ deleteAlbums: boolean }>(config.baseUrl)
				.mutate(DELETE_MANY_ALBUMS)
				.variables({ filter: { albumId_in: ids } })
				.expectNoErrors();

			expect(deleteData?.deleteAlbums).toBe(true);
		});

		test('should have unchanged artist count after create and delete many', async () => {
			const { data: before } = await request<{ artists: Artist[] }>(config.baseUrl)
				.query(GET_ARTISTS)
				.expectNoErrors();

			const initialCount = before?.artists?.length ?? 0;

			const { data: createData } = await request<{ createArtists: Artist[] }>(config.baseUrl)
				.mutate(CREATE_MANY_ARTISTS)
				.variables({
					input: [
						{ ...dialect.primaryKey('artistId', dialect.nextId('artist')), name: 'Temporary One' },
						{ ...dialect.primaryKey('artistId', dialect.nextId('artist')), name: 'Temporary Two' },
					],
				})
				.expectNoErrors();

			const ids = createData?.createArtists?.map((a) => a.artistId) ?? [];

			await request<{ deleteArtists: boolean }>(config.baseUrl)
				.mutate(DELETE_MANY_ARTISTS)
				.variables({ filter: { artistId_in: ids } })
				.expectNoErrors();

			const { data: after } = await request<{ artists: Artist[] }>(config.baseUrl)
				.query(GET_ARTISTS)
				.expectNoErrors();

			expect(after?.artists).toHaveLength(initialCount);
		});
	});
};
