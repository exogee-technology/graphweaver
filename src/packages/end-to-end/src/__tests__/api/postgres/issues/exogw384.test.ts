// import assert from 'assert';
// import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';
// import Graphweaver from '@exogee/graphweaver-server';
// import gql from 'graphql-tag';

// // ESLint, I know it looks like the entities in this file aren't used, but they actually are.
// /* eslint-disable @typescript-eslint/no-unused-vars */

// const existingEntity = { id: '1', description: 'Test User' };
// const entityToCreate = { id: '2', description: 'Test User' };
// const dataProviderWithFindOne = new BaseDataProvider('EntityWithClientGeneratedId');
// dataProviderWithFindOne.updateOne = async () => undefined;
// dataProviderWithFindOne.createOne = async (params) => undefined;
// dataProviderWithFindOne.findOne = async (params: any) => {
// 	if (params?.id === existingEntity.id) {
// 		return existingEntity;
// 	}
// 	return undefined;
// };

// @Entity('EntityWithClientGeneratedId', {
// 	provider: dataProviderWithFindOne,
// 	apiOptions: { clientGeneratedPrimaryKeys: true },
// })
// class EntityWithClientGeneratedId {
// 	@Field(() => ID)
// 	id!: string;

// 	@Field(() => String)
// 	description!: string;
// }

// const providerWithCreateOne = new BaseDataProvider('EntityWithoutClientGeneratedId');
// providerWithCreateOne.createOne = async () => undefined;

// @Entity('EntityWithoutClientGeneratedId', {
// 	provider: providerWithCreateOne,
// 	apiOptions: { clientGeneratedPrimaryKeys: false },
// })
// class EntityWithoutClientGeneratedId {
// 	@Field(() => ID)
// 	id!: string;

// 	@Field(() => String)
// 	description!: string;
// }

// @Entity('EntityWithClientGeneratedIdNotDefined', {
// 	provider: providerWithCreateOne,
// })
// class EntityWithClientGeneratedIdNotDefined {
// 	@Field(() => ID)
// 	id!: string;

// 	@Field(() => String)
// 	description!: string;
// }

// const graphweaver = new Graphweaver();

// describe('clientGeneratedPrimaryKeys', () => {
// 	test('should throw error because the ID is marked as client-generated, but we are not passing an ID when trying to create a record', async () => {
// 		const response = await graphweaver.executeOperation({
// 			query: gql`
// 				mutation {
// 					createEntityWithClientGeneratedId(input: { description: "Test User" }) {
// 						id
// 						description
// 					}
// 				}
// 			`,
// 		});

// 		assert(response.body.kind === 'single');
// 		expect(response.body.singleResult.errors?.[0]?.message).toBe(
// 			'Field "EntityWithClientGeneratedIdInsertInput.id" of required type "ID!" was not provided.'
// 		);
// 	});

// 	test('should successfully create a record when the ID is provided for client-generated ID entity', async () => {
// 		const response = await graphweaver.executeOperation<any>({
// 			query: gql`
// 				mutation {
// 					createEntityWithClientGeneratedId(input: { id: ${entityToCreate.id}, description: "${entityToCreate.description}" }) {
// 						id
// 						description
// 					}
// 				}
// 			`,
// 		});

// 		assert(response.body.kind === 'single');
// 		expect(response.body.singleResult).toBeDefined();
// 		expect(response.body.singleResult.errors).toBeUndefined();
// 	});

// 	test('should throw error because there is already an entity with that ID', async () => {
// 		const response = await graphweaver.executeOperation<any>({
// 			query: gql`
// 				mutation {
// 					createEntityWithClientGeneratedId(input: { id: ${existingEntity.id}, description: "${existingEntity.description}" }) {
// 						id
// 						description
// 					}
// 				}
// 			`,
// 		});

// 		assert(response.body.kind === 'single');
// 		expect(response.body.singleResult.errors?.[0]?.message).toBe(
// 			`Entity with ID ${existingEntity.id} already exists`
// 		);
// 	});

// 	test('should NOT throw error because the ID is NOT marked as client-generated, and we are not passing an ID when trying to create a record', async () => {
// 		const response = await graphweaver.executeOperation({
// 			query: gql`
// 				mutation {
// 					createEntityWithoutClientGeneratedId(input: { description: "Test User" }) {
// 						id
// 						description
// 					}
// 				}
// 			`,
// 		});

// 		assert(response.body.kind === 'single');
// 		expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
// 	});

// 	test('should not throw error because entity does not define clientGeneratedPrimaryKeys', async () => {
// 		const response = await graphweaver.executeOperation({
// 			query: gql`
// 				mutation {
// 					createEntityWithClientGeneratedIdNotDefined(input: { description: "Test User" }) {
// 						id
// 						description
// 					}
// 				}
// 			`,
// 		});

// 		assert(response.body.kind === 'single');
// 		expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
// 	});
// });
