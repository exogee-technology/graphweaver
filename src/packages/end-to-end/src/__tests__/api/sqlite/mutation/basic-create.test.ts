import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { Album } from '../../../../types';
import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

describe('basic create', () => {
	beforeEach(resetDatabase);

	test('should create an album', async () => {
		const { data } = await request<{ createAlbum: Album }>(config.baseUrl)
			.mutate(gql`
				mutation CreateAlbum($input: AlbumInsertInput!) {
					createAlbum(input: $input) {
						id
					}
				}
			`)
			.variables({ input: { artist: { id: 1 }, title: 'string' } })
			.expectNoErrors();

		expect(data?.createAlbum?.id).toBe('348');
	});
});
