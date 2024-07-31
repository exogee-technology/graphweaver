import assert from 'assert';
import { Field, ID, Entity, RelationshipField, BackendProvider } from '@exogee/graphweaver';
import Graphweaver from '@exogee/graphweaver-server';
import gql from 'graphql-tag';

// ESLint, I know it looks like the entities in this file aren't used, but they actually are.
/* eslint-disable @typescript-eslint/no-unused-vars */

test('should correctly resolve a non-provider-bound entity when the foreign key is in the parent entity', async () => {
	@Entity('Task', {
		provider: {
			findOne: async () => ({ taskId: '1', userId: '2' }),
		} as unknown as BackendProvider<unknown>,
	})
	class Task {
		@Field(() => ID, { primaryKeyField: true })
		taskId!: string;

		@Field(() => ID)
		userId!: string;

		@RelationshipField(() => User, { id: 'userId' })
		user!: User;
	}

	@Entity('User', { apiOptions: { excludeFromBuiltInOperations: true } })
	class User {
		@Field(() => ID, { primaryKeyField: true })
		userId!: string;
	}

	const graphweaver = new Graphweaver();
	const response = await graphweaver.executeOperation({
		query: gql`
			query {
				task(id: "1") {
					taskId
					user {
						userId
					}
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	expect(response.body.singleResult.errors).toBeUndefined();
	expect(response.body.singleResult.data).toMatchObject({
		task: {
			taskId: '1',
			user: {
				userId: '2',
			},
		},
	});

	// This should also be correctly advertised to via the _graphweaver metadata service
	const response2 = await graphweaver.executeOperation<{
		_graphweaver: {
			entities: [
				{
					name: string;
					fields: {
						name: string;
						relatedEntity: string;
						relationshipType: string;
					}[];
				},
			];
		};
	}>({
		query: gql`
			query {
				_graphweaver {
					entities {
						name
						fields {
							name
							relatedEntity
							relationshipType
						}
					}
				}
			}
		`,
	});
	assert(response2.body.kind === 'single');
	expect(response2.body.singleResult.errors).toBeUndefined();
	const taskEntity = response2.body.singleResult.data?._graphweaver.entities.find(
		(entity) => entity.name === 'Task'
	);
	expect(taskEntity).toMatchObject({
		name: 'Task',
		fields: [
			{
				name: 'taskId',
				relatedEntity: null,
				relationshipType: null,
			},
			{
				name: 'userId',
				relatedEntity: null,
				relationshipType: null,
			},
			{
				name: 'user',
				relatedEntity: 'User',
				relationshipType: 'MANY_TO_ONE',
			},
		],
	});
});
