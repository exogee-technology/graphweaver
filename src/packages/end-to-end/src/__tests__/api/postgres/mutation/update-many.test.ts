import request from 'supertest-graphql';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';
import { Artist, Album, UPDATE_MANY_ARTISTS, UPDATE_MANY_ALBUMS } from '../../shared';

describe('updateMany mutations', () => {
	beforeEach(resetDatabase);

	test('should update multiple artists', async () => {
		const { data } = await request<{ updateArtists: Artist[] }>(config.baseUrl)
			.mutate(UPDATE_MANY_ARTISTS)
			.variables({
				input: [
					{ artistId: '1', name: 'Updated Artist One' },
					{ artistId: '2', name: 'Updated Artist Two' },
				],
			})
			.expectNoErrors();

		expect(data?.updateArtists).toHaveLength(2);
		expect(data?.updateArtists?.[0]?.artistId).toBe('1');
		expect(data?.updateArtists?.[0]?.name).toBe('Updated Artist One');
		expect(data?.updateArtists?.[1]?.artistId).toBe('2');
		expect(data?.updateArtists?.[1]?.name).toBe('Updated Artist Two');
	});
});
