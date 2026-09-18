/**
 * The query IR.
 *
 * This is pure data. It knows nothing about any dialect and it cannot hold a fragment of SQL:
 * there is deliberately no `{ kind: 'raw' }` node and no `sql` tagged template. If you need
 * something this union can't express, add a node and a compiler case for it, which is a change
 * somebody has to review.
 *
 * That closure is the first of the three things that make parameterisation structural rather than
 * a convention. See `compile/compiler.ts` for the other two.
 */

export type ColumnType =
	| 'boolean'
	| 'int'
	| 'bigint'
	| 'float'
	| 'decimal'
	| 'string'
	| 'text'
	| 'uuid'
	| 'json'
	| 'date'
	| 'time'
	| 'datetime'
	| 'binary'
	| 'array'
	| 'unknown';

/** Generated, never derived from user input or entity names. See `AliasAllocator`. */
export type TableAlias = string;

export interface TableRef {
	schema?: string;
	name: string;
	alias: TableAlias;
}

export interface BoundParam {
	value: unknown;
	type: ColumnType;
	/** Precision, array encoding and the like, where the type alone is not enough. */
	meta?: ColumnMeta;
}

/** Details a `ColumnType` cannot carry on its own. */
export interface ColumnMeta {
	precision?: number;
	scale?: number;
	length?: number;
	/** `array` only: the type of each element. */
	items?: ColumnType;
	/**
	 * `array` only: how the list is stored.
	 *
	 * Only Postgres has real arrays. Everywhere else a list lives in a JSON column or, as MikroORM
	 * wrote them, a delimited string -- so the encoding has to be part of the mapping rather than
	 * something the provider can assume.
	 */
	arrayEncoding?: 'native' | 'json' | 'delimited';
	/** `delimited` arrays only. Defaults to a comma, matching MikroORM. */
	delimiter?: string;
}

export type Expr =
	| { kind: 'column'; table: TableAlias; column: string; type: ColumnType }
	| { kind: 'param'; value: unknown; type: ColumnType; meta?: ColumnMeta }
	| { kind: 'lower'; operand: Expr }
	| { kind: 'countStar' }
	| { kind: 'literalOne' };

export type CompareOperator = '=' | '<>' | '<' | '<=' | '>' | '>=';

export type Predicate =
	| { kind: 'compare'; op: CompareOperator; left: Expr; right: Expr }
	| { kind: 'isNull'; operand: Expr; negated: boolean }
	| { kind: 'in'; operand: Expr; values: Expr[]; negated: boolean }
	| { kind: 'like'; operand: Expr; pattern: Expr; caseInsensitive: boolean; negated: boolean }
	| { kind: 'and'; operands: Predicate[] }
	| { kind: 'or'; operands: Predicate[] }
	| { kind: 'not'; operand: Predicate }
	| { kind: 'exists'; select: SelectNode; negated: boolean }
	| { kind: 'true' }
	| { kind: 'false' };

export interface OrderByItem {
	expr: Expr;
	direction: 'ASC' | 'DESC';
	/**
	 * Omitted for non-nullable columns. Two of the four dialects have to emulate NULLS ordering
	 * with a computed sort term, and emitting one for a column that cannot be null is both wasted
	 * work and liable to stop the planner using an index for the sort.
	 */
	nulls?: 'FIRST' | 'LAST';
}

export interface JoinNode {
	type: 'inner' | 'left';
	table: TableRef;
	on: Predicate;
}

export interface SelectNode {
	kind: 'select';
	columns: { expr: Expr; as?: string }[];
	from: TableRef;
	joins: JoinNode[];
	where?: Predicate;
	orderBy: OrderByItem[];
	/** A validated integer, never an expression. The one value that is inlined rather than bound. */
	limit?: number;
	offset?: number;
}

/**
 * Writes are always addressed by primary key, because that is all core ever asks for: updateOne
 * takes an id, and both delete paths resolve their filter to a set of keys first so they can count
 * the rows before touching them. Keeping it that way avoids the UPDATE/DELETE aliasing divergence
 * between the dialects entirely -- SQL Server cannot alias an UPDATE target the way the others can.
 */
export interface InsertNode {
	kind: 'insert';
	into: TableRef;
	columns: string[];
	rows: Expr[][];
	/** Column names to read back, where the dialect can do it in one round trip. */
	returning?: string[];
}

export interface UpdateNode {
	kind: 'update';
	table: TableRef;
	set: { column: string; value: Expr }[];
	/**
	 * Columns here compile unqualified, because the write statements never alias their target --
	 * SQL Server cannot alias an UPDATE target the way the others can. That means a write
	 * predicate cannot contain an EXISTS, and the compiler refuses one rather than emitting
	 * something that only works on three dialects.
	 */
	where: Predicate;
}

export interface DeleteNode {
	kind: 'delete';
	from: TableRef;
	where: Predicate;
}

export type Statement = SelectNode | InsertNode | UpdateNode | DeleteNode;
