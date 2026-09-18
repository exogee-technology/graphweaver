import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Database } from 'node-sqlite3-wasm';
import { defineConnection } from '@exogee/graphweaver-sql';
import { runConformanceSuite } from '@exogee/graphweaver-sql/lib/testing';
import { sqlite } from '../driver';
import { ddl } from './ddl';

const database = new Database(':memory:');

runConformanceSuite({
	hooks: { describe, it, beforeAll, beforeEach, expect },
	name: 'sqlite',
	connection: defineConnection({
		id: 'conformance-sqlite',
		dialect: sqlite.fromDatabase(database),
	}),
	ddl,
	raw: async (sql) => database.all(sql) as Record<string, unknown>[],
});
