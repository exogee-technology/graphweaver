import type { Dialect } from './dialect';
import { nativeOrderByItem } from './dialect';

export const postgres: Dialect = {
	name: 'postgres',
	displayName: 'PostgreSQL',

	quoteIdentifier: (name) => `"${name.replace(/"/g, '""')}"`,
	placeholder: (index) => `$${index + 1}`,

	maxBindParameters: 65535,
	maxDataLoaderBatchSize: 5000,

	supportsNativeIlike: true,
	requiresOrderByForPagination: false,
	countExpression: 'count(*)',

	compilePagination(limit, offset) {
		const parts: string[] = [];
		if (limit !== undefined) parts.push(`LIMIT ${limit}`);
		// Postgres is the only one of the four that accepts a bare OFFSET.
		if (offset !== undefined) parts.push(`OFFSET ${offset}`);
		return parts.length ? parts.join(' ') : undefined;
	},

	compileOrderByItem: nativeOrderByItem,

	compileInsert: ({ table, columns, values, returning, quote }) =>
		`INSERT INTO ${table} (${columns}) VALUES ${values}` +
		(returning ? ` RETURNING ${returning.map(quote).join(', ')}` : ''),

	insertKeyStrategy: 'returning',
	defaultValuesClause: 'DEFAULT VALUES',

	beginStatements: (level) => [
		// One statement, so unlike a SET SESSION it cannot leak onto the next borrower of this
		// pooled connection. Note READ UNCOMMITTED is silently READ COMMITTED on Postgres.
		`BEGIN ISOLATION LEVEL ${level}`,
	],
};
