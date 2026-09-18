import { DialectOptions } from './dialect';

/**
 * The SQLite Chinook seed is the only one that declares AUTOINCREMENT, so it is also the only one
 * where the database hands out primary keys. Resetting it is a file copy, which is cheap enough to
 * do between every test.
 */
export const sqliteOptions: DialectOptions = {
	name: 'SQLite',
	clientGeneratedPrimaryKeys: false,
	reset: 'each-test',
};

export const postgresOptions: DialectOptions = {
	name: 'PostgreSQL',
	clientGeneratedPrimaryKeys: true,
	reset: 'once-per-file',
};

/**
 * MySQL's reseed is ~15.6k INSERTs and runs close to Node's 30s default hook timeout on a cold
 * container, so it gets its own.
 */
export const mysqlOptions: DialectOptions = {
	name: 'MySQL',
	clientGeneratedPrimaryKeys: true,
	reset: 'once-per-file',
	resetTimeout: 60_000,
};

/**
 * The SQL Server seed drops and recreates the whole database, which is both slower than the others
 * and the reason its reset connects to `master` rather than to Chinook.
 */
export const mssqlOptions: DialectOptions = {
	name: 'SQL Server',
	clientGeneratedPrimaryKeys: true,
	reset: 'once-per-file',
	resetTimeout: 120_000,
};
