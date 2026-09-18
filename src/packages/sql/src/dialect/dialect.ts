import type { BoundParam, OrderByItem } from '../ir/nodes';

export type DialectName = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

export enum IsolationLevel {
	READ_UNCOMMITTED = 'READ UNCOMMITTED',
	READ_COMMITTED = 'READ COMMITTED',
	REPEATABLE_READ = 'REPEATABLE READ',
	SERIALIZABLE = 'SERIALIZABLE',
}

/**
 * Ranked so a transaction can refuse to run inside a weaker one. Asking for something stricter
 * than the transaction you are already in is an error rather than a silent downgrade.
 */
export const ISOLATION_RANK: Record<IsolationLevel, number> = {
	[IsolationLevel.READ_UNCOMMITTED]: 1,
	[IsolationLevel.READ_COMMITTED]: 2,
	[IsolationLevel.REPEATABLE_READ]: 3,
	[IsolationLevel.SERIALIZABLE]: 4,
};

export interface Dialect {
	readonly name: DialectName;

	/**
	 * What the Admin UI calls this data source, as in "From SQLite (275 rows)".
	 *
	 * Spelled the way each vendor spells it. The provider uses it unless an entity says otherwise,
	 * so a generated file does not have to repeat `backendDisplayName` on every entity the way the
	 * MikroORM importer did -- and a hand written entity gets it without asking.
	 */
	readonly displayName: string;

	/** Always applied. We never conditionally quote, so reserved words need no special handling. */
	quoteIdentifier(name: string): string;

	/** `$1`, `?`, `@p0` -- whatever this driver binds by. */
	placeholder(zeroBasedIndex: number, param: BoundParam): string;

	/**
	 * The hard ceiling on bound parameters in one statement. On SQL Server this is 2100 and
	 * exceeding it is a TDS error, not a slow query, so the compiler chunks long IN lists.
	 */
	readonly maxBindParameters: number;

	/** What we report to core as `maxDataLoaderBatchSize`, derived from the ceiling above. */
	readonly maxDataLoaderBatchSize: number;

	/** Only Postgres has ILIKE. Everyone else gets LOWER(x) LIKE LOWER(y). */
	readonly supportsNativeIlike: boolean;

	/** SQL Server refuses OFFSET/FETCH without an ORDER BY. */
	readonly requiresOrderByForPagination: boolean;

	readonly countExpression: string;

	/**
	 * How generated primary keys come back from an INSERT.
	 *  - `returning` : Postgres, and SQLite 3.35+. Exact, one round trip.
	 *  - `output`    : SQL Server's OUTPUT INSERTED.*, which errors (334) on a table with a
	 *                  trigger and needs a SCOPE_IDENTITY fallback.
	 *  - `insertId`  : MySQL has no RETURNING at all, so a batch insert recovers a contiguous
	 *                  range from insertId + affectedRows and re-selects it.
	 */
	readonly insertKeyStrategy: 'returning' | 'output' | 'insertId';

	/** `DEFAULT VALUES` everywhere except MySQL, which spells it `() VALUES ()`. */
	readonly defaultValuesClause: string;

	/** The statements that open a transaction at this isolation level. */
	beginStatements(level: IsolationLevel): string[];

	/**
	 * Assembles an INSERT. The dialects disagree on more than a suffix: Postgres and SQLite put
	 * RETURNING at the end, SQL Server puts OUTPUT between the column list and VALUES, and MySQL
	 * has nowhere to put anything.
	 */
	compileInsert(parts: {
		table: string;
		columns: string;
		values: string;
		returning?: string[];
		quote: (name: string) => string;
	}): string;

	/** Returns the clause that follows ORDER BY, or undefined when there's no paging to emit. */
	compilePagination(limit: number | undefined, offset: number | undefined): string | undefined;

	/** Given the already-compiled expression, produce one complete ORDER BY item. */
	compileOrderByItem(expressionText: string, item: OrderByItem): string;
}

/** ANSI NULLS ordering, for the two dialects that support the syntax directly. */
export const nativeOrderByItem = (expressionText: string, item: OrderByItem) =>
	item.nulls
		? `${expressionText} ${item.direction} NULLS ${item.nulls}`
		: `${expressionText} ${item.direction}`;

/**
 * For dialects with no NULLS clause. `expr IS NULL` is 1 for nulls and 0 otherwise, so sorting
 * that DESC puts nulls first and ASC puts them last, independently of the real sort direction.
 */
export const emulatedOrderByItem = (nullTest: string, expressionText: string, item: OrderByItem) =>
	item.nulls
		? `${nullTest} ${item.nulls === 'FIRST' ? 'DESC' : 'ASC'}, ${expressionText} ${item.direction}`
		: `${expressionText} ${item.direction}`;
