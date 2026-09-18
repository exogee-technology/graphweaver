import type { Dialect } from './dialect';
import { nativeOrderByItem } from './dialect';

/** SQLite has no bare OFFSET either, but spells "no limit" as -1. */
const NO_LIMIT = '-1';

export const sqlite: Dialect = {
	name: 'sqlite',
	displayName: 'SQLite',

	quoteIdentifier: (name) => `"${name.replaceAll('"', '""')}"`,
	placeholder: () => '?',

	// SQLITE_MAX_VARIABLE_NUMBER; 32766 since 3.32, 999 on older builds. Feature-detect on connect.
	maxBindParameters: 32766,
	maxDataLoaderBatchSize: 5000,

	supportsNativeIlike: false,
	requiresOrderByForPagination: false,
	countExpression: 'count(*)',

	compilePagination(limit, offset) {
		if (limit === undefined && offset === undefined) return undefined;
		if (offset === undefined) return `LIMIT ${limit}`;
		return `LIMIT ${limit ?? NO_LIMIT} OFFSET ${offset}`;
	},

	compileOrderByItem: nativeOrderByItem,

	// SQLite 3.35+. Older builds need a last_insert_rowid() fallback, so the driver feature
	// detects on connect.
	compileInsert: ({ table, columns, values, returning, quote }) =>
		// RETURNING needs SQLite 3.35+. The driver feature detects on connect and clears
		// `returning` on the plan when the build is older.
		`INSERT INTO ${table} (${columns}) VALUES ${values}` +
		(returning ? ` RETURNING ${returning.map(quote).join(', ')}` : ''),

	insertKeyStrategy: 'returning',
	defaultValuesClause: 'DEFAULT VALUES',

	// Every SQLite transaction is effectively serialisable, so the level is ignored. IMMEDIATE
	// takes the write lock up front rather than risking SQLITE_BUSY on a later lock upgrade.
	beginStatements: () => ['BEGIN IMMEDIATE'],
};
