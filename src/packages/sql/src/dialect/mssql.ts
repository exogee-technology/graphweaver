import type { Dialect } from './dialect';
import { emulatedOrderByItem } from './dialect';

export const mssql: Dialect = {
	name: 'mssql',
	displayName: 'SQL Server',

	quoteIdentifier: (name) => `[${name.replaceAll(']', ']]')}]`,
	placeholder: (index) => `@p${index}`,

	// SQL Server's limit is 2100 parameters per request, and going over it is an error rather than
	// a slow query -- which is why this dialect reports a much smaller dataloader batch size than
	// the others and why the provider splits its writes. Two of the 2100 are spoken for: a
	// parameterised statement runs through `sp_executesql`, whose own statement text and parameter
	// declarations are the first two. So 2098 is what is actually available to us, and a statement
	// built to the nominal 2100 fails by exactly two.
	maxBindParameters: 2098,
	maxDataLoaderBatchSize: 500,

	supportsNativeIlike: false,
	// OFFSET/FETCH is only legal after an ORDER BY, which is why the planner always appends the
	// primary key as a tiebreak.
	requiresOrderByForPagination: true,
	// COUNT(*) returns int and overflows silently past 2^31.
	countExpression: 'COUNT_BIG(*)',

	compilePagination(limit, offset) {
		if (limit === undefined && offset === undefined) return undefined;
		// Using OFFSET 0 rather than TOP keeps this to one code path.
		const clause = `OFFSET ${offset ?? 0} ROWS`;
		return limit === undefined ? clause : `${clause} FETCH NEXT ${limit} ROWS ONLY`;
	},

	compileOrderByItem: (expressionText, item) =>
		emulatedOrderByItem(
			`CASE WHEN ${expressionText} IS NULL THEN 1 ELSE 0 END`,
			expressionText,
			item
		),

	// OUTPUT INSERTED.* fails with error 334 on a table carrying a trigger, so the driver caches
	// a per-table decision to fall back to SCOPE_IDENTITY.
	compileInsert: ({ table, columns, values, returning, quote }) =>
		// OUTPUT sits between the column list and VALUES, not at the end.
		`INSERT INTO ${table} (${columns})` +
		(returning ? ` OUTPUT ${returning.map((name) => `INSERTED.${quote(name)}`).join(', ')}` : '') +
		` VALUES ${values}`,

	insertKeyStrategy: 'output',
	defaultValuesClause: 'DEFAULT VALUES',

	beginStatements: (level) => [
		// This one IS connection sticky, which is why the driver calls reset() on release.
		`SET TRANSACTION ISOLATION LEVEL ${level}`,
		'BEGIN TRANSACTION',
	],
};
