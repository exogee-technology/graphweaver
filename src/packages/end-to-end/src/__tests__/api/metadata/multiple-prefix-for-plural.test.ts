import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should return multipleFish as plural name for Fish', async () => {
	@Entity('Fish', {
		provider: new BaseDataProvider('fish'),
	})
	class Fish {
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
