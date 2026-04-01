/**
 * Regression: createMany on PostgreSQL skipped em.flush(), so database-generated PKs
 * were missing on returned entities. Nested batched-writes then failed injecting FKs
 * (misleading "Source node … not found" from dependencyInjector).
 *
 * Repro requires: parent with multiple children in one createMany batch, at least one
 * child having nested grandchildren (second child has components pattern).
 *
 * Run: `DATABASE=postgres pnpm exec jest --runInBand --forceExit -- api/postgres/issues/nested-createmany-needs-flush-for-db-pk.test.ts`
 * (PostgreSQL must be reachable with standard e2e credentials and database `gw`.)
 */
import gql from 'graphql-tag';
import assert from 'node:assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	Entity as DataEntity,
	BigIntType,
	Collection,
	EntityManager,
	Ref,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import { Field, ID, Entity, RelationshipField } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const TABLE_PARENT = 'gw_batch_flush_parent';
const TABLE_CHILD = 'gw_batch_flush_child';
const TABLE_GRANDCHILD = 'gw_batch_flush_grandchild';
const CM_ID = 'batch-flush-nested-create-test';

@DataEntity({ tableName: TABLE_PARENT })
class OrmBatchFlushParent {
	@PrimaryKey({ type: new BigIntType('string'), autoincrement: true })
	id!: string;

	@Property({ type: 'string', length: 500 })
	name!: string;

	@OneToMany(() => OrmBatchFlushChild, (c) => c.parent)
	children? = new Collection<OrmBatchFlushChild>(this);
}

@DataEntity({ tableName: TABLE_CHILD })
class OrmBatchFlushChild {
	@PrimaryKey({ type: new BigIntType('string'), autoincrement: true })
	id!: string;

	@ManyToOne(() => OrmBatchFlushParent, { ref: true, deleteRule: 'cascade' })
	parent!: Ref<OrmBatchFlushParent>;

	@Property({ type: 'string', length: 500 })
	label!: string;

	@OneToMany(() => OrmBatchFlushGrandchild, (g) => g.child)
	grandchildren? = new Collection<OrmBatchFlushGrandchild>(this);
}

@DataEntity({ tableName: TABLE_GRANDCHILD })
class OrmBatchFlushGrandchild {
	@PrimaryKey({ type: new BigIntType('string'), autoincrement: true })
	id!: string;

	@ManyToOne(() => OrmBatchFlushChild, { ref: true, deleteRule: 'cascade' })
	child!: Ref<OrmBatchFlushChild>;

	@Property({ type: 'string', length: 500 })
	value!: string;
}

const dbConfig = {
	host: process.env.DATABASE_HOST || 'localhost',
	port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT, 10) : 5432,
	user: process.env.DATABASE_USERNAME || 'postgres',
	password: process.env.DATABASE_PASSWORD || 'postgres',
	dbName: process.env.DATABASE_NAME || 'gw',
};

const connection = {
	connectionManagerId: CM_ID,
	mikroOrmConfig: {
		entities: [OrmBatchFlushParent, OrmBatchFlushChild, OrmBatchFlushGrandchild],
		driver: PostgreSqlDriver,
		...dbConfig,
	},
};

@Entity<BatchFlushParent>('BatchFlushParent', {
	provider: new MikroBackendProvider(OrmBatchFlushParent, connection),
})
class BatchFlushParent {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	name!: string;

	@RelationshipField<BatchFlushChild>(() => [BatchFlushChild], { relatedField: 'parent' })
	children!: BatchFlushChild[];
}

@Entity<BatchFlushChild>('BatchFlushChild', {
	provider: new MikroBackendProvider(OrmBatchFlushChild, connection),
})
class BatchFlushChild {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField<BatchFlushParent>(() => BatchFlushParent, { id: (e) => e.id })
	parent!: BatchFlushParent;

	@Field(() => String)
	label!: string;

	@RelationshipField<BatchFlushGrandchild>(() => [BatchFlushGrandchild], {
		relatedField: 'child',
	})
	grandchildren!: BatchFlushGrandchild[];
}

@Entity<BatchFlushGrandchild>('BatchFlushGrandchild', {
	provider: new MikroBackendProvider(OrmBatchFlushGrandchild, connection),
})
class BatchFlushGrandchild {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField<BatchFlushChild>(() => BatchFlushChild, { id: (e) => e.id })
	child!: BatchFlushChild;

	@Field(() => String)
	value!: string;
}

const graphweaver = new Graphweaver();
let em: EntityManager | undefined;

const shouldRun = process.env.DATABASE === 'postgres';

(shouldRun ? describe : describe.skip)(
	'Postgres nested create — createMany must flush for DB-assigned PKs (batched writes inject)',
	() => {
		beforeAll(async () => {
			const { Client } = await import('pg');
			const client = new Client({
				host: dbConfig.host,
				port: dbConfig.port,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.dbName,
			});
			await client.connect();
			await client.query(`DROP TABLE IF EXISTS ${TABLE_GRANDCHILD} CASCADE`);
			await client.query(`DROP TABLE IF EXISTS ${TABLE_CHILD} CASCADE`);
			await client.query(`DROP TABLE IF EXISTS ${TABLE_PARENT} CASCADE`);
			await client.query(`
				CREATE TABLE ${TABLE_PARENT} (
					id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
					name character varying(500) NOT NULL
				)
			`);
			await client.query(`
				CREATE TABLE ${TABLE_CHILD} (
					id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
					parent_id bigint NOT NULL REFERENCES ${TABLE_PARENT}(id) ON DELETE CASCADE,
					label character varying(500) NOT NULL
				)
			`);
			await client.query(`
				CREATE TABLE ${TABLE_GRANDCHILD} (
					id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
					child_id bigint NOT NULL REFERENCES ${TABLE_CHILD}(id) ON DELETE CASCADE,
					value character varying(500) NOT NULL
				)
			`);
			await client.end();

			const connectionResult = await ConnectionManager.connect(CM_ID, connection);
			em = connectionResult?.em;
			assert(em !== undefined);
		});

		afterAll(async () => {
			if (!shouldRun || !em) return;
			const { Client } = await import('pg');
			const client = new Client({
				host: dbConfig.host,
				port: dbConfig.port,
				user: dbConfig.user,
				password: dbConfig.password,
				database: dbConfig.dbName,
			});
			await client.connect();
			await client.query(`DROP TABLE IF EXISTS ${TABLE_GRANDCHILD} CASCADE`);
			await client.query(`DROP TABLE IF EXISTS ${TABLE_CHILD} CASCADE`);
			await client.query(`DROP TABLE IF EXISTS ${TABLE_PARENT} CASCADE`);
			await client.end();
			await ConnectionManager.close(CM_ID);
		});

		beforeEach(async () => {
			if (!em) return;
			await em.getConnection().execute(`DELETE FROM ${TABLE_GRANDCHILD}`);
			await em.getConnection().execute(`DELETE FROM ${TABLE_CHILD}`);
			await em.getConnection().execute(`DELETE FROM ${TABLE_PARENT}`);
		});

		test('createBatchFlushParent nested children + grandchildren succeeds', async () => {
			const response = await graphweaver.executeOperation<{
				createBatchFlushParent: {
					id: string;
					name: string;
					children: {
						id: string;
						label: string;
						grandchildren: { id: string; value: string }[];
					}[];
				};
			}>({
				query: gql`
					mutation CreateBatchFlushParent($input: BatchFlushParentInsertInput!) {
						createBatchFlushParent(input: $input) {
							id
							name
							children {
								id
								label
								grandchildren {
									id
									value
								}
							}
						}
					}
				`,
				variables: {
					input: {
						name: 'root',
						children: [
							{ label: 'no-grandchildren', grandchildren: [] },
							{
								label: 'with-grandchildren',
								grandchildren: [{ value: 'nested-value' }],
							},
						],
					},
				},
			});

			assert(response.body.kind === 'single');
			const errors = response.body.singleResult.errors;
			expect(errors).toBeUndefined();
			const row = response.body.singleResult.data?.createBatchFlushParent;
			expect(row?.name).toBe('root');
			expect(row?.id).toBeDefined();
			expect(row?.children).toHaveLength(2);
			expect(row?.children?.[0]?.label).toBe('no-grandchildren');
			expect(row?.children?.[0]?.grandchildren).toHaveLength(0);
			expect(row?.children?.[1]?.label).toBe('with-grandchildren');
			expect(row?.children?.[1]?.grandchildren).toHaveLength(1);
			expect(row?.children?.[1]?.grandchildren?.[0]?.value).toBe('nested-value');
		});
	}
);
