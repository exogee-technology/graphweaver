import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Query, Resolver } from '@exogee/graphweaver';

import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@Resolver()
class JsonResolver {
	@Query(() => GraphQLJSON)
	async testJson(): Promise<{ test: string }> {
		return {
			test: 'test',
		};
	}
}

describe('GraphQL JSON Scalar Type', () => {
	test('should not get error when requesting GraphQL Json scalar types', async () => {
		const graphweaver = new Graphweaver({
			resolvers: [JsonResolver],
		});

		graphweaver.startServer();

		const response = await graphweaver.server?.executeOperation({
			query: gql`
				query {
					testJson
				}
			`,
		});

		assert(response !== undefined);
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.testJson).toMatchObject({ test: 'test' });
	});
});
