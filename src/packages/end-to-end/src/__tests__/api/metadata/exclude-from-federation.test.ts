import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { Field, ID, Entity, BaseDataProvider, RelationshipField } from '@exogee/graphweaver';
import { Kind, ObjectTypeDefinitionNode, parse } from 'graphql';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should include User in the schema but not in the federation _service { sdl } query', async () => {
	@Entity('Task', {
		provider: new BaseDataProvider('task'),
	})
	class Task {
		@Field(() => ID)
		id!: string;

		@RelationshipField(() => User, { relatedField: 'id' })
		userId!: string;
	}

	@Entity('User', {
		provider: new BaseDataProvider('user'),
		apiOptions: { excludeFromFederation: true },
	})
	class User {
		@Field(() => ID)
		id!: string;

		@Field(() => String)
		name!: string;
	}
	const graphweaver = new Graphweaver({ federationSubgraphName: 'test' });

	// Federation _service { sdl } query should not include User
	const response = await graphweaver.executeOperation<{ _service: { sdl: string } }>({
		query: gql`
			query {
				_service {
					sdl
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	assert(response.body.singleResult.data?._service !== undefined);

	const document = parse(response.body.singleResult.data?._service.sdl);

	// The User type shouldn't exist at all
	expect(
		document.definitions.find(
			(definition) =>
				definition.kind === Kind.OBJECT_TYPE_DEFINITION && definition.name.value === 'User'
		)
	).toBeUndefined();

	// And the user field on task shouldn't exist either
	const taskType = document.definitions.find(
		(definition) =>
			definition.kind === Kind.OBJECT_TYPE_DEFINITION && definition.name.value === 'Task'
	) as ObjectTypeDefinitionNode;
	expect(taskType.fields?.length).toBe(1);
	expect(taskType.fields?.[0].name.value).toBe('id');

	// But the normal introspection should
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
