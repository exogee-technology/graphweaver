import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider } from '@exogee/graphweaver';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should return fishes as plural name when overridden', async () => {
	@Entity('Fish', {
		provider: new BaseDataProvider('fish'),
		plural: 'fishes',
	})
	class Fish {
		@Field(() => ID)
		id!: string;

		@Field(() => String)
		name!: string;
	}

	const graphweaver = new Graphweaver();
	const response = await graphweaver.executeOperation<{
		_graphweaver: {
			entities: [{ name: string; plural: string }];
		};
	}>({
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
	const filteredEntities = response.body.singleResult.data?._graphweaver.entities.filter(
		(entity) => entity.name === 'Fish'
	);
	expect(filteredEntities).toMatchObject([{ name: 'Fish', plural: 'Fishes' }]);

	const introspection = await graphweaver.executeOperation<{
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
