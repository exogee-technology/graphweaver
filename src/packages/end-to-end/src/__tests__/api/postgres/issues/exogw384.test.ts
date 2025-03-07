import assert from 'assert';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';
import Graphweaver from '@exogee/graphweaver-server';
import gql from 'graphql-tag';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

const dataProviderWithFindOne = new BaseDataProvider('EntityWithClientGeneratedId');
dataProviderWithFindOne.updateOne = async () => undefined;
dataProviderWithFindOne.createOne = async () => undefined;
dataProviderWithFindOne.findOne = async () => ({ id: '12345', description: 'Test User' });
@Entity('EntityWithClientGeneratedId', {
	provider: dataProviderWithFindOne,
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
class EntityWithClientGeneratedId {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;
}

const providerWithCreateOne = new BaseDataProvider('EntityWithoutClientGeneratedId');
providerWithCreateOne.createOne = async () => undefined;

@Entity('EntityWithoutClientGeneratedId', {
	provider: providerWithCreateOne,
	apiOptions: { clientGeneratedPrimaryKeys: false },
})
class EntityWithoutClientGeneratedId {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;
}

@Entity('EntityWitClientGeneratedIdNotDefined', {
	provider: providerWithCreateOne,
})
class EntityWitClientGeneratedIdNotDefined {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	description!: string;
}

const graphweaver = new Graphweaver();

describe('clientGeneratedPrimaryKeys', () => {
	test('should throw error because the ID is marked as client-generated, but we are not passing an ID when trying to create a record', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createEntityWithClientGeneratedId(input: { description: "Test User" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Field "EntityWithClientGeneratedIdInsertInput.id" of required type "ID!" was not provided.'
		);
	});

	test('should successfully create a record when the ID is provided for client-generated ID entity', async () => {
		const response = await graphweaver.executeOperation<any>({
			query: gql`
				mutation {
					createEntityWithClientGeneratedId(input: { id: "12345", description: "Test User" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
	});

	test('should NOT throw error because the ID is NOT marked as client-generated, and we are not passing an ID when trying to create a record', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createEntityWithoutClientGeneratedId(input: { description: "Test User" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
	});

	test('should not throw error because entity does not define clientGeneratedPrimaryKeys', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createEntityWitClientGeneratedIdNotDefined(input: { description: "Test User" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBeUndefined();
	});
});
