import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should correctly plural name for User', async () => {
	@Entity('User', {
		provider: new BaseDataProvider('user'),
	})
	class User {
		@Field(() => ID)
		id!: string;

		@Field(() => String)
		name!: string;
	}
	const graphweaver = new Graphweaver();

	const response = await graphweaver.server.executeOperation({
		query: gql`
			query {
				_graphweaver {
					entities {
						name
						plural
					}
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	expect(response.body.singleResult.errors).toBeUndefined();
	expect(response.body.singleResult.data?._graphweaver).toMatchObject({
		entities: [{ name: 'User', plural: 'Users' }],
	});

	const introspection = await graphweaver.server.executeOperation<{
		__schema: { types: { name: string; fields: { name: string }[] }[] };
	}>({
		query: gql`
			query {
				__schema {
					types {
						kind
						name
						fields {
							name
						}
					}
				}
			}
		`,
	});
	assert(introspection.body.kind === 'single');
	const mutations = introspection.body.singleResult.data?.__schema?.types?.find(
		(type: any) => type.name === 'Mutation'
	);
	assert(mutations);
	const mutationNames = mutations.fields.map((field: any) => field.name);

	expect(mutationNames).toContain('createUsers');
	expect(mutationNames).toContain('createUser');
	expect(mutationNames).toContain('updateUsers');
	expect(mutationNames).toContain('createOrUpdateUsers');
	expect(mutationNames).toContain('updateUser');
	expect(mutationNames).toContain('deleteUser');
	expect(mutationNames).toContain('deleteUsers');

	const queries = introspection.body.singleResult.data?.__schema?.types?.find(
		(type: any) => type.name === 'Query'
	);
	assert(queries);
	const queryNames = queries.fields.map((field: any) => field.name);

	expect(queryNames).toContain('user');
	expect(queryNames).toContain('users');
});

test('should throw when plural name matches an existing entity', async () => {
	try {
		@Entity('Fish', {
			provider: new BaseDataProvider('fish'),
			plural: 'users',
		})
		class Fish {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@Entity('User', {
			provider: new BaseDataProvider('user'),
		})
		class User {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}
	} catch (e: any) {
		expect(e.message).toMatch(
			'Graphweaver Startup Error: Failed to generate base resolver queries (users). Check your custom queries for any name collisions or duplicate plural name usage.'
		);
	}
});

test('should throw when plural name matches an existing entity', async () => {
	try {
		@Entity('Fish', {
			provider: new BaseDataProvider('user'),
		})
		class Fish {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@Entity('User', {
			provider: new BaseDataProvider('user'),
			plural: 'multipleFish',
		})
		class User {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}
	} catch (e: any) {
		expect(e.message).toMatch(
			'Graphweaver Startup Error: Failed to generate base resolver queries (multipleFish). Check your custom queries for any name collisions or duplicate plural name usage.'
		);
	}
});
