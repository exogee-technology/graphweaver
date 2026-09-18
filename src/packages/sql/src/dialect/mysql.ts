import type { Dialect } from './dialect';
import { emulatedOrderByItem } from './dialect';

/** MySQL has no bare OFFSET, so it needs a limit. This is the documented idiom for "all rows". */
const NO_LIMIT = '18446744073709551615';

export const mysql: Dialect = {
	name: 'mysql',
	displayName: 'MySQL',

	quoteIdentifier: (name) => `\`${name.replaceAll('`', '``')}\``,
	placeholder: () => '?',

	// Really bounded by max_allowed_packet rather than a fixed count; this is a safe working limit.
	maxBindParameters: 10000,
	maxDataLoaderBatchSize: 5000,

	supportsNativeIlike: false,
	requiresOrderByForPagination: false,
	countExpression: 'count(*)',

	compilePagination(limit, offset) {
		if (limit === undefined && offset === undefined) return undefined;
		if (offset === undefined) return `LIMIT ${limit}`;
		return `LIMIT ${limit ?? NO_LIMIT} OFFSET ${offset}`;
	},

	compileOrderByItem: (expressionText, item) =>
		emulatedOrderByItem(`(${expressionText} IS NULL)`, expressionText, item),

	// No RETURNING at all. A batch insert has to recover its keys from insertId + affectedRows.
	compileInsert: ({ table, columns, values }) =>
		// Nowhere to put a returning clause: keys come back via insertId + affectedRows.
		`INSERT INTO ${table} (${columns}) VALUES ${values}`,

	insertKeyStrategy: 'insertId',
	defaultValuesClause: '() VALUES ()',

	beginStatements: (level) => [
		// Applies to the next transaction only, not the session, so nothing leaks.
		`SET TRANSACTION ISOLATION LEVEL ${level}`,
		'START TRANSACTION',
	],
};
