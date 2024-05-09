import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity, ID, Field, GraphQLEntity, BaseDataProvider } from '@exogee/graphweaver';

import { GraphQLJSON } from '@exogee/graphweaver-scalars';

describe('GraphQL JSON Scalar Type', () => {
	test('should return json when requesting GraphQL Json scalar types', async () => {
		class DataProvider extends BaseDataProvider<{ id: string }, User> {
			async find() {
				return [
					{
						id: '1',
					},
				];
			}
		}
		@Entity('User', {
			provider: new DataProvider('user'),
		})
		class User extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => GraphQLJSON)
			async testJson(): Promise<{ test: string }> {
				return {
					test: 'test',
				};
			}
		}
		const graphweaver = new Graphweaver();

		const response = await graphweaver.server.executeOperation({
			query: gql`
				query {
					users {
						id
						testJson
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.data?.users).toMatchObject([
			{ id: '1', testJson: { test: 'test' } },
		]);
	});
});
