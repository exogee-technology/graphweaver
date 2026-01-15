import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, Hook, HookRegister } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

describe('Hooks', () => {
	test('should correctly call a hook when the hook is a decorated static method', async () => {
		let called = false;

		@Entity('User', {
			provider: {
				backendId: 'dummy-provider',
				find: async () => [{ id: '1', name: 'Test User' }],
				findOne: async () => undefined,
				findByRelatedId: async () => [],
				updateOne: async () => undefined,
				updateMany: async () => [],
				createOne: async () => undefined,
				createMany: async () => [],
				createOrUpdateMany: async () => [],
				deleteOne: async () => false,
				deleteMany: async () => false,
			},
		})
		class User {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;

			@Hook(HookRegister.BEFORE_READ)
			static beforeRead(params: any) {
				called = true;
				return params;
			}
		}
		const graphweaver = new Graphweaver();

		const response = await graphweaver.executeOperation<{
			users: {
				id: string;
			};
		}>({
			query: gql`
				query {
					users {
						id
					}
				}
			`,
		});
		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(called).toBe(true);
	});
});
