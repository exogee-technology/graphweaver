import request from 'supertest-graphql';
import gql from 'graphql-tag';

import { config } from '../../../../config';
import { resetDatabase } from '../../../../utils';

type Album = {
	albumId: number;
	title: string;
	artist: {
		artistId: number;
		name: string;
	};
};

describe('basic query', () => {
	beforeEach(resetDatabase);

	test('should get albums', async () => {
		const { data } = await request<{ albums: Album[] }>(config.baseUrl)
			.query(gql`
				query {
					albums {
						albumId
					}
				}
			`)
			.expectNoErrors();

		expect(data?.albums).toHaveLength(347);
	});
});
