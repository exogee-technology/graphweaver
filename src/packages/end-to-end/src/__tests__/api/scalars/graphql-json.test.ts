import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Entity, ID, Field, BaseDataProvider } from '@exogee/graphweaver';

import { GraphQLJSON } from '@exogee/graphweaver-scalars';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('GraphQL JSON Scalar Type', () => {
	test('should return json when requesting GraphQL Json scalar types', async () => {
		class DataProvider extends BaseDataProvider<{ id: string }> {
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
		class User {
			@Field(() => ID)
			id!: string;

			@Field(() => GraphQLJSON)
			testJson(): { test: string } {
				return {
					test: 'test',
				};
			}

			static fromBackendEntity(data: { id: string }) {
				const user = new User();
				Object.assign(user, data);
				return user;
			}
		}

		const graphweaver = new Graphweaver();

		const response = await graphweaver.executeOperation({
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
