import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	BaseDataProvider,
	Resolver,
	createBaseResolver,
	graphweaverMetadata,
	getMetadataStorage,
} from '@exogee/graphweaver';

describe('Metadata Plural', () => {
	beforeEach(() => {
		// Clear metadata
		graphweaverMetadata.clear();
		const metadata = getMetadataStorage();
		// reset the TypeGraphQL metadata
		metadata.queries = metadata.queries.filter((query) => query.schemaName === '_graphweaver');
		metadata.mutations = [];
	});
	test('should correctly plural name for User', async () => {
		@ObjectType('User')
		class User extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}
		@Resolver((of) => User)
		class UserResolver extends createBaseResolver<User, any>(User, new BaseDataProvider('user')) {}

		const graphweaver = new Graphweaver({
			resolvers: [UserResolver],
		});

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

	test('should return multipleFish as plural name for Fish', async () => {
		@ObjectType('Fish')
		class Fish extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@Resolver((of) => Fish)
		class FishResolver extends createBaseResolver<Fish, any>(Fish, new BaseDataProvider('fish')) {}

		const graphweaver = new Graphweaver({
			resolvers: [FishResolver],
		});

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
		expect(response.body.singleResult.data?._graphweaver).toMatchObject({
			entities: [{ name: 'Fish', plural: 'MultipleFish' }],
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

		expect(mutationNames).toContain('createMultipleFish');
		expect(mutationNames).toContain('createFish');
		expect(mutationNames).toContain('updateMultipleFish');
		expect(mutationNames).toContain('createOrUpdateMultipleFish');
		expect(mutationNames).toContain('updateFish');
		expect(mutationNames).toContain('deleteFish');
		expect(mutationNames).toContain('deleteMultipleFish');

		const queries = introspection.body.singleResult.data?.__schema?.types?.find(
			(type: any) => type.name === 'Query'
		);
		assert(queries);
		const queryNames = queries.fields.map((field: any) => field.name);

		expect(queryNames).toContain('fish');
		expect(queryNames).toContain('multipleFish');
	});

	test('should return fishes as plural name when overridden', async () => {
		@ObjectType('Fish')
		class Fish extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@Resolver((of) => Fish)
		class FishResolver extends createBaseResolver<Fish, any>(Fish, new BaseDataProvider('fish'), {
			plural: 'fishes',
		}) {}

		const graphweaver = new Graphweaver({
			resolvers: [FishResolver],
		});

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
		expect(response.body.singleResult.data?._graphweaver).toMatchObject({
			entities: [{ name: 'Fish', plural: 'Fishes' }],
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

		expect(mutationNames).toContain('createFishes');
		expect(mutationNames).toContain('createFish');
		expect(mutationNames).toContain('updateFishes');
		expect(mutationNames).toContain('createOrUpdateFishes');
		expect(mutationNames).toContain('updateFish');
		expect(mutationNames).toContain('deleteFish');
		expect(mutationNames).toContain('deleteFishes');

		const queries = introspection.body.singleResult.data?.__schema?.types?.find(
			(type: any) => type.name === 'Query'
		);
		assert(queries);
		const queryNames = queries.fields.map((field: any) => field.name);

		expect(queryNames).toContain('fish');
		expect(queryNames).toContain('fishes');
	});

	test('should throw when plural name matches an existing entity', async () => {
		@ObjectType('Fish')
		class Fish extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@ObjectType('User')
		class User extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}
		try {
			createBaseResolver<User, any>(User, new BaseDataProvider('user'));
			createBaseResolver<Fish, any>(Fish, new BaseDataProvider('fish'), {
				plural: 'users',
			});
		} catch (e: any) {
			expect(e.message).toMatch(
				'Graphweaver Startup Error: Failed to generate base resolver queries (users). Check your custom queries for any name collisions or duplicate plural name usage.'
			);
		}
	});

	test('should throw when plural name matches an existing entity', async () => {
		@ObjectType('Fish')
		class Fish extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}

		@ObjectType('User')
		class User extends GraphQLEntity<any> {
			@Field(() => ID)
			id!: string;

			@Field(() => String)
			name!: string;
		}
		try {
			createBaseResolver<User, any>(User, new BaseDataProvider('user'), { plural: 'multipleFish' });
			createBaseResolver<Fish, any>(Fish, new BaseDataProvider('fish'));
		} catch (e: any) {
			expect(e.message).toMatch(
				'Graphweaver Startup Error: Failed to generate base resolver queries (multipleFish). Check your custom queries for any name collisions or duplicate plural name usage.'
			);
		}
	});
});
