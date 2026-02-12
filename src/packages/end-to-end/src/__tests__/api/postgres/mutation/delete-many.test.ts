import request from 'supertest-graphql';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
import {
	Artist,
	Album,
	CREATE_MANY_ARTISTS,
	CREATE_MANY_ALBUMS,
	DELETE_MANY_ARTISTS,
	DELETE_MANY_ALBUMS,
	GET_ARTISTS,
	GET_ALBUMS,
} from '../../shared';

describe('deleteMany mutations', () => {
	beforeAll(resetDatabase);
	afterAll(resetDatabase);

	test('should create then delete multiple artists', async () => {
		// Create
		const { data: createData } = await request<{ createArtists: Artist[] }>(config.baseUrl)
			.mutate(CREATE_MANY_ARTISTS)
			.variables({ input: [{ artistId: '276', name: 'To Delete One' }, { artistId: '277', name: 'To Delete Two' }] })
			.expectNoErrors();

		expect(createData?.createArtists).toHaveLength(2);

		const ids = createData?.createArtists?.map((a) => a.artistId) ?? [];

		// Delete
		const { data: deleteData } = await request<{ deleteArtists: boolean }>(config.baseUrl)
			.mutate(DELETE_MANY_ARTISTS)
			.variables({ filter: { artistId_in: ids } })
			.expectNoErrors();

		expect(deleteData?.deleteArtists).toBe(true);
	});

	test('should create then delete multiple albums', async () => {
		// Create
		const { data: createData } = await request<{ createAlbums: Album[] }>(config.baseUrl)
			.mutate(CREATE_MANY_ALBUMS)
			.variables({
				input: [
					{ albumId: '348', title: 'To Delete One', artist: { artistId: 1 } },
					{ albumId: '349', title: 'To Delete Two', artist: { artistId: 1 } },
				],
			})
			.expectNoErrors();

		expect(createData?.createAlbums).toHaveLength(2);

		const ids = createData?.createAlbums?.map((a) => a.albumId) ?? [];

		// Delete
		const { data: deleteData } = await request<{ deleteAlbums: boolean }>(config.baseUrl)
			.mutate(DELETE_MANY_ALBUMS)
			.variables({ filter: { albumId_in: ids } })
			.expectNoErrors();

		expect(deleteData?.deleteAlbums).toBe(true);
	});

	test('should have unchanged artist count after create and delete many', async () => {
		// Get initial count
		const { data: before } = await request<{ artists: Artist[] }>(config.baseUrl)
			.query(GET_ARTISTS)
			.expectNoErrors();

		const initialCount = before?.artists?.length ?? 0;

		// Create
		const { data: createData } = await request<{ createArtists: Artist[] }>(config.baseUrl)
			.mutate(CREATE_MANY_ARTISTS)
			.variables({ input: [{ artistId: '276', name: 'Temporary One' }, { artistId: '277', name: 'Temporary Two' }] })
			.expectNoErrors();

		const ids = createData?.createArtists?.map((a) => a.artistId) ?? [];

		// Delete
		await request<{ deleteArtists: boolean }>(config.baseUrl)
			.mutate(DELETE_MANY_ARTISTS)
			.variables({ filter: { artistId_in: ids } })
			.expectNoErrors();

		// Verify count restored
		const { data: after } = await request<{ artists: Artist[] }>(config.baseUrl)
			.query(GET_ARTISTS)
			.expectNoErrors();

		expect(after?.artists).toHaveLength(initialCount);
	});
});
