process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.DATABASE = 'sqlite';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	Collection,
	PrimaryKey,
	Property,
	OneToMany,
	ManyToOne,
	wrap,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite';

@DataEntity({ tableName: 'RootWithClientId' })
export class OrmRootWithClientId {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'string', nullable: true })
	description?: string;

	@OneToMany({ entity: () => OrmChildWithClientId, mappedBy: 'rootWithClientId' })
	childrenWithClientId = new Collection<OrmChildWithClientId>(this);

	@OneToMany({ entity: () => OrmChildWithBackendId, mappedBy: 'rootWithClientId' })
	childrenWithBackendId = new Collection<OrmChildWithBackendId>(this);

	constructor(id?: string) {
		if (id) {
			this.id = id;
		}
	}
}

@DataEntity({ tableName: 'RootWithBackendId' })
export class OrmRootWithBackendId {
	@PrimaryKey({ type: 'number' })
	id!: number;

	@Property({ type: 'string', nullable: true })
	description?: string;

	@OneToMany({ entity: () => OrmChildWithClientId, mappedBy: 'rootWithBackendId' })
	childrenWithClientId = new Collection<OrmChildWithClientId>(this);

	@OneToMany({ entity: () => OrmChildWithBackendId, mappedBy: 'rootWithBackendId' })
	childrenWithBackendId = new Collection<OrmChildWithBackendId>(this);

	constructor(id?: number, description?: string) {
		if (id) {
			this.id = id;
		}
		if (description) {
			this.description = description;
		}
	}
}

@DataEntity({ tableName: 'ChildWithClientId' })
export class OrmChildWithClientId {
	@PrimaryKey({ type: 'string' })
	id!: string;

	@Property({ type: 'string', nullable: true })
	description?: string;

	@ManyToOne({ entity: () => OrmRootWithClientId, nullable: true })
	rootWithClientId?: OrmRootWithClientId;

	@ManyToOne({ entity: () => OrmRootWithBackendId, nullable: true })
	rootWithBackendId?: OrmRootWithBackendId;

	constructor(id?: string, description?: string) {
		if (id) {
			this.id = id;
		}
		if (description) {
			this.description = description;
		}
	}
}

@DataEntity({ tableName: 'ChildWithBackendId' })
export class OrmChildWithBackendId {
	@PrimaryKey({ type: 'number' })
	id!: number;

	@Property({ type: 'string', nullable: true })
	description?: string;

	@ManyToOne({ entity: () => OrmRootWithClientId, nullable: true })
	rootWithClientId?: OrmRootWithClientId;

	@ManyToOne({ entity: () => OrmRootWithBackendId, nullable: true })
	rootWithBackendId?: OrmRootWithBackendId;

	constructor(id?: number, description?: string) {
		if (id) {
			this.id = id;
		}
		if (description) {
			this.description = description;
		}
	}
}

const connection = {
	connectionManagerId: 'sqlite',
	mikroOrmConfig: {
		entities: [
			OrmRootWithClientId,
			OrmChildWithClientId,
			OrmChildWithBackendId,
			OrmRootWithBackendId,
		],
		driver: SqliteDriver,
		dbName: 'databases/database.sqlite',
		debug: true,
	},
};

@Entity('RootWithClientId', {
	provider: new MikroBackendProvider(OrmRootWithClientId, connection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class RootWithClientId {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<ChildWithClientId>(() => [ChildWithClientId], {
		relatedField: 'rootWithClientId',
	})
	childrenWithClientId!: ChildWithClientId[];

	@RelationshipField<ChildWithBackendId>(() => [ChildWithBackendId], {
		relatedField: 'rootWithClientId',
	})
	childrenWithBackendId!: ChildWithBackendId[];
}

@Entity('RootWithBackendId', {
	provider: new MikroBackendProvider(OrmRootWithBackendId, connection),
})
export class RootWithBackendId {
	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<ChildWithClientId>(() => [ChildWithClientId], {
		relatedField: 'rootWithBackendId',
	})
	childrenWithClientId!: ChildWithClientId[];

	@RelationshipField<ChildWithBackendId>(() => [ChildWithBackendId], {
		relatedField: 'rootWithBackendId',
	})
	childrenWithBackendId!: ChildWithBackendId[];
}

@Entity('ChildWithClientId', {
	provider: new MikroBackendProvider(OrmChildWithClientId, connection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class ChildWithClientId {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<RootWithClientId>(() => RootWithClientId, {
		relatedField: 'childrenWithClientId',
	})
	rootWithClientId!: RootWithClientId;

	@RelationshipField<RootWithBackendId>(() => RootWithBackendId, {
		relatedField: 'childrenWithClientId',
	})
	rootWithBackendId!: RootWithBackendId;
}

@Entity('ChildWithBackendId', {
	provider: new MikroBackendProvider(OrmChildWithBackendId, connection),
})
export class ChildWithBackendId {
	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true })
	description?: string;

	@RelationshipField<RootWithClientId>(() => RootWithClientId, {
		relatedField: 'childrenWithBackendId',
	})
	rootWithClientId!: RootWithClientId;

	@RelationshipField<RootWithBackendId>(() => RootWithBackendId, {
		relatedField: 'childrenWithBackendId',
	})
	rootWithBackendId!: RootWithBackendId;
}

const graphweaver = new Graphweaver();
let em: EntityManager | undefined = undefined;

beforeAll(async () => {
	const connectionResult = await ConnectionManager.connect('sqlite', connection);
	em = connectionResult?.em;
	assert(em !== undefined);

	// If tables exist then fail, we are assuming that the tables do not exist
	const tables = await em
		?.getConnection()
		.execute('SELECT name FROM sqlite_master WHERE type="table"');
	const tableNames = tables.map((table: any) => table.name);

	assert(!tableNames.includes('RootWithClientId'));
	assert(!tableNames.includes('RootWithBackendId'));
	assert(!tableNames.includes('ChildWithClientId'));
	assert(!tableNames.includes('ChildWithBackendId'));

	await em
		?.getConnection()
		.execute('CREATE TABLE RootWithClientId (id TEXT PRIMARY KEY, description TEXT)');
	await em
		?.getConnection()
		.execute(
			'CREATE TABLE RootWithBackendId (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT)'
		);
	await em
		?.getConnection()
		.execute(
			'CREATE TABLE ChildWithClientId (id TEXT PRIMARY KEY, root_with_client_id_id TEXT, root_with_backend_id_id INTEGER, description TEXT)'
		);
	await em
		?.getConnection()
		.execute(
			'CREATE TABLE ChildWithBackendId (id INTEGER PRIMARY KEY AUTOINCREMENT, root_with_client_id_id TEXT, root_with_backend_id_id INTEGER, description TEXT)'
		);
});

afterAll(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DROP TABLE RootWithClientId');
	await em.getConnection().execute('DROP TABLE RootWithBackendId');
	await em.getConnection().execute('DROP TABLE ChildWithClientId');
	await em.getConnection().execute('DROP TABLE ChildWithBackendId');
	await em.getConnection().close();
});

beforeEach(async () => {
	assert(em !== undefined);
	await em.getConnection().execute('DELETE FROM RootWithClientId');
	await em.getConnection().execute('DELETE FROM RootWithBackendId');
	await em.getConnection().execute('DELETE FROM ChildWithClientId');
	await em.getConnection().execute('DELETE FROM ChildWithBackendId');
});

describe('EXOGW-384 Nested - Create operations', () => {
	it('Should succeed - create rootClientId only', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithClientId(input: { id: "1", description: "Root 1" }) {
						id
						description
					}
				}
			`,
		});

		const rootRecords = await em?.getRepository(OrmRootWithClientId).findAll();
		assert(rootRecords !== undefined);
		expect(rootRecords).toHaveLength(1);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			createRootWithClientId: {
				id: '1',
				description: 'Root 1',
			},
		});
	});

	it('Should succeed - create rootBackendId only', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithBackendId(input: { description: "Root 1" }) {
						id
						description
					}
				}
			`,
		});

		const rootRecords = await em?.getRepository(OrmRootWithBackendId).findAll();
		assert(rootRecords !== undefined);
		expect(rootRecords).toHaveLength(1);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			createRootWithBackendId: {
				id: '1',
				description: 'Root 1',
			},
		});
	});

	it('Should succeed - create rootClientId + childrenClientId + childrenBackendId', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithClientId(
						input: {
							id: "1"
							description: "Root 1"
							childrenWithClientId: [
								{ id: "1", description: "Child 1" }
								{ id: "2", description: "Child 2" }
							]
							childrenWithBackendId: [{ description: "Child 3" }, { description: "Child 4" }]
						}
					) {
						id
						description
						childrenWithClientId {
							id
							description
						}
						childrenWithBackendId {
							id
							description
						}
					}
				}
			`,
		});

		const rootRecords = await em?.getRepository(OrmRootWithClientId).findAll();
		assert(rootRecords !== undefined);
		expect(rootRecords).toHaveLength(1);
		const [rootRecord] = rootRecords;

		const childrenWithClientIdRecords = await em?.getRepository(OrmChildWithClientId).findAll();
		assert(childrenWithClientIdRecords !== undefined);
		expect(childrenWithClientIdRecords).toHaveLength(2);

		const childrenWithBackendIdRecords = await em?.getRepository(OrmChildWithBackendId).findAll();
		assert(childrenWithBackendIdRecords !== undefined);
		expect(childrenWithBackendIdRecords).toHaveLength(2);
		const [child1, child2] = childrenWithBackendIdRecords;

		assert(response.body.kind === 'single');
		console.log(response.body?.singleResult?.data);
		console.log(JSON.stringify(response.body?.singleResult?.data));
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			createRootWithClientId: {
				id: `${rootRecord.id}`,
				description: 'Root 1',
				childrenWithClientId: [
					{ id: '1', description: 'Child 1' },
					{ id: '2', description: 'Child 2' },
				],
				childrenWithBackendId: [
					{ id: `${child1.id}`, description: 'Child 3' },
					{ id: `${child2.id}`, description: 'Child 4' },
				],
			},
		});
	});

	// @TODO: https://exogee.atlassian.net/browse/EXOGW-431
	// it('Should succeed - create rootBackendId + childrenClientId + childrenBackendId', async () => {
	// 	const response = await graphweaver.executeOperation({
	// 		query: gql`
	// 			mutation {
	// 				createRootWithBackendId(
	// 					input: {
	// 						description: "Root 1"
	// 						childrenWithClientId: [
	// 							{ id: "1", description: "Child 1" }
	// 							{ id: "2", description: "Child 2" }
	// 						]
	// 						childrenWithBackendId: [{ description: "Child 3" }, { description: "Child 4" }]
	// 					}
	// 				) {
	// 					description
	// 					id
	// 					childrenWithClientId {
	// 						id
	// 						description
	// 					}
	// 					childrenWithBackendId {
	// 						id
	// 						description
	// 					}
	// 				}
	// 			}
	// 		`,
	// 	});

	// 	const rootRecords = await em?.getConnection().execute('SELECT * FROM RootWithBackendId');
	// 	assert(rootRecords !== undefined);
	// 	expect(rootRecords).toHaveLength(1);
	// 	const [rootRecord] = rootRecords;

	// 	const childrenWithClientIdRecords = await em
	// 		?.getConnection()
	// 		.execute('SELECT * FROM ChildWithClientId');
	// 	assert(childrenWithClientIdRecords !== undefined);
	// 	expect(childrenWithClientIdRecords).toHaveLength(2);

	// 	const childrenWithBackendIdRecords = await em
	// 		?.getConnection()
	// 		.execute('SELECT * FROM ChildWithBackendId');
	// 	assert(childrenWithBackendIdRecords !== undefined);
	// 	expect(childrenWithBackendIdRecords).toHaveLength(2);
	// 	const [child1, child2] = childrenWithBackendIdRecords ?? [];

	// 	assert(response.body.kind === 'single');

	// 	console.log(JSON.stringify(response.body?.singleResult?.data));

	// 	expect(response.body.singleResult.errors).toBeUndefined();
	// 	expect(response.body.singleResult.data).toEqual({
	// 		createRootWithClientId: {
	// 			id: `${rootRecord.id}`,
	// 			description: 'Root 1',
	// 			childrenWithClientId: [
	// 				{ id: '1', description: 'Child 1' },
	// 				{ id: '2', description: 'Child 2' },
	// 			],
	// 			childrenWithBackendId: [
	// 				{
	// 					id: `${child1.id}`,
	// 					description: 'Child 3',
	// 				},
	// 				{
	// 					id: `${child2.id}`,
	// 					description: 'Child 4',
	// 				},
	// 			],
	// 		},
	// 	});
	// });

	it('Should fail - passing IDs to childrenWithBackendId', async () => {
		const childId = '123';
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithClientId(
						input: {
							id: "1"
							description: "Root 1"
							childrenWithBackendId: [
								{ id: ${childId}, description: "Child ${childId}" }
							]
						}
					) {
						id
						description
						childrenWithClientId {
							id
							description
						}
						childrenWithBackendId {
							id
							description
						}
					}
				}
			`,
		});

		const rootRecords = await em?.getConnection().execute('SELECT * FROM RootWithClientId');
		const childrenWithClientIdRecords = await em
			?.getConnection()
			.execute('SELECT * FROM ChildWithClientId');
		const childrenWithBackendIdRecords = await em
			?.getConnection()
			.execute('SELECT * FROM ChildWithBackendId');

		console.log(rootRecords);
		console.log(childrenWithClientIdRecords);
		console.log(childrenWithBackendIdRecords);

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			`Cannot create entity with ID '${childId}' because clientGeneratedPrimaryKeys is not enabled.`
		);
	});

	it('Should fail - passing no IDs to childrenWithClientId', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithClientId(
						input: {
							id: "1"
							description: "Root 1"
							childrenWithClientId: [{ description: "Child 1" }, { description: "Child 2" }]
							childrenWithBackendId: [
								{ id: "3", description: "Child 3" }
								{ id: "4", description: "Child 4" }
							]
						}
					) {
						id
						description
						childrenWithClientId {
							id
							description
						}
						childrenWithBackendId {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Field "ChildWithClientIdCreateOrUpdateInput.id" of required type "ID!" was not provided.'
		);
	});

	it('Should fail - passing IDs to rootWithBackendId', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithBackendId(input: { id: "1", description: "Root 1" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Field "id" is not defined by type "RootWithBackendIdInsertInput".'
		);
	});

	it('Should fail - passing no IDs to rootWithClientId', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					createRootWithClientId(input: { description: "Root 1" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toBe(
			'Field "RootWithClientIdInsertInput.id" of required type "ID!" was not provided.'
		);
	});
});

describe('EXOGW-384 Nested - Update operations', () => {
	it('Should succeed - update rootClientId only', async () => {
		assert(em !== undefined);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithClientId(input: { id: "1", description: "Updated Root 1" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithClientId: {
				id: '1',
				description: 'Updated Root 1',
			},
		});
	});

	it('Should succeed - update rootClientId + childrenClientId', async () => {
		assert(em !== undefined);
		const rootWithClientId = wrap(new OrmRootWithClientId()).assign({
			id: '1',
			description: 'Root 1',
		});

		const child1 = wrap(new OrmChildWithClientId()).assign({
			id: '1',
			description: 'Child 1',
		});

		const child2 = wrap(new OrmChildWithClientId()).assign({
			id: '2',
			description: 'Child 2',
		});

		rootWithClientId.childrenWithClientId.add(child1);
		rootWithClientId.childrenWithClientId.add(child2);

		await em.persistAndFlush([rootWithClientId, child1, child2]);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithClientId(
						input: {
							id: "1"
							description: "Updated Root 1"
							childrenWithClientId: [{ id: "1", description: "Updated Child 1" }]
						}
					) {
						id
						description
						childrenWithClientId {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithClientId: {
				id: '1',
				description: 'Updated Root 1',
				childrenWithClientId: [
					{ id: '1', description: 'Updated Child 1' },
					{ id: '2', description: 'Child 2' },
				],
			},
		});
	});

	it('Should succeed - update rootClientId + childrenBackendId', async () => {
		assert(em !== undefined);
		const rootWithClientId = wrap(new OrmRootWithClientId()).assign({
			id: '1',
			description: 'Root 1',
		});

		const child1 = wrap(new OrmChildWithBackendId()).assign({
			id: 1,
			description: 'Child 1',
		});

		const child2 = wrap(new OrmChildWithBackendId()).assign({
			id: 2,
			description: 'Child 2',
		});

		rootWithClientId.childrenWithBackendId.add(child1);
		rootWithClientId.childrenWithBackendId.add(child2);

		await em.persistAndFlush([rootWithClientId, child1, child2]);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithClientId(
						input: {
							id: "1"
							description: "Updated Root 1"
							childrenWithBackendId: [{ id: "1", description: "Updated Child 1" }]
						}
					) {
						id
						description
						childrenWithBackendId {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithClientId: {
				id: '1',
				description: 'Updated Root 1',
				childrenWithBackendId: [
					{ id: '1', description: 'Updated Child 1' },
					{ id: '2', description: 'Child 2' },
				],
			},
		});
	});

	it('Should succeed - update rootBackendId only', async () => {
		assert(em !== undefined);
		const rootWithBackendId = wrap(new OrmRootWithBackendId()).assign({
			id: 1,
			description: 'Root 1',
		});

		await em.persistAndFlush(rootWithBackendId);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithBackendId(input: { id: "1", description: "Updated Root 1" }) {
						id
						description
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithBackendId: {
				id: '1',
				description: 'Updated Root 1',
			},
		});
	});

	it('Should succeed - update rootBackendId + childrenClientId', async () => {
		assert(em !== undefined);
		const rootWithBackendId = wrap(new OrmRootWithBackendId()).assign({
			id: 1,
			description: 'Root 1',
		});

		const child1 = wrap(new OrmChildWithClientId()).assign({
			id: '1',
			description: 'Child 1',
		});

		const child2 = wrap(new OrmChildWithClientId()).assign({
			id: '2',
			description: 'Child 2',
		});

		rootWithBackendId.childrenWithClientId.add(child1);
		rootWithBackendId.childrenWithClientId.add(child2);

		await em.persistAndFlush([rootWithBackendId, child1, child2]);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithBackendId(
						input: {
							id: "1"
							description: "Updated Root 1"
							childrenWithClientId: [{ id: "1", description: "Updated Child 1" }]
						}
					) {
						id
						description
						childrenWithClientId {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithBackendId: {
				id: '1',
				description: 'Updated Root 1',
				childrenWithClientId: [
					{ id: '1', description: 'Updated Child 1' },
					{ id: '2', description: 'Child 2' },
				],
			},
		});
	});

	it('Should succeed - update rootBackendId + childrenBackendId', async () => {
		assert(em !== undefined);
		const rootWithBackendId = wrap(new OrmRootWithBackendId()).assign({
			id: 1,
			description: 'Root 1',
		});

		const child1 = wrap(new OrmChildWithBackendId()).assign({
			id: 1,
			description: 'Child 1',
		});

		const child2 = wrap(new OrmChildWithBackendId()).assign({
			id: 2,
			description: 'Child 2',
		});

		rootWithBackendId.childrenWithBackendId.add(child1);
		rootWithBackendId.childrenWithBackendId.add(child2);

		await em.persistAndFlush([rootWithBackendId, child1, child2]);

		const response = await graphweaver.executeOperation({
			query: gql`
				mutation {
					updateRootWithBackendId(
						input: {
							id: "1"
							description: "Updated Root 1"
							childrenWithBackendId: [{ id: "1", description: "Updated Child 1" }]
						}
					) {
						id
						description
						childrenWithBackendId {
							id
							description
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();
		expect(response.body.singleResult.data).toEqual({
			updateRootWithBackendId: {
				id: '1',
				description: 'Updated Root 1',
				childrenWithBackendId: [
					{ id: '1', description: 'Updated Child 1' },
					{ id: '2', description: 'Child 2' },
				],
			},
		});
	});
});
