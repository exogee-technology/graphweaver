import type { ColumnType } from '../ir/nodes';

/**
 * A raw SQL fragment, for the things the filter grammar cannot express: a JSON path, a window
 * function, a recursive CTE.
 *
 * Deferred rather than compiled on the spot, because the placeholder syntax is a dialect's
 * business -- `$1` on Postgres, `?` on MySQL and SQLite, `@p0` on SQL Server. The connection
 * resolves it against its own dialect when the query runs.
 *
 * Interpolations always become bound parameters. There is no way to interpolate an identifier,
 * which is the point: a tagged template that silently concatenated a table name would be a much
 * worse escape hatch than no escape hatch at all.
 */
export interface RawQuery {
	readonly strings: readonly string[];
	readonly values: readonly unknown[];
	/** Optional per-value column types, where the default of `unknown` is not good enough. */
	readonly types?: readonly (ColumnType | undefined)[];
}

export const sql = (strings: TemplateStringsArray, ...values: unknown[]): RawQuery => ({
	strings,
	values,
});

/**
 * Types the interpolations of a raw query, which SQL Server needs because every parameter there
 * carries an explicit TDS type.
 *
 *     connection.raw(typed(sql`SELECT * FROM t WHERE id = ${id}`, ['bigint']))
 */
export const typed = (query: RawQuery, types: (ColumnType | undefined)[]): RawQuery => ({
	...query,
	types,
});
