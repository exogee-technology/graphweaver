import type { Dialect } from '../dialect/dialect';
import type {
	BoundParam,
	DeleteNode,
	Expr,
	InsertNode,
	Predicate,
	SelectNode,
	Statement,
	TableRef,
	UpdateNode,
} from '../ir/nodes';

export interface SqlFragment {
	text: string;
	params: BoundParam[];
}

export interface CompileOptions {
	/**
	 * Overrides how long an IN list may get before it is chunked. Only here so tests can show the
	 * chunking shape without a 2100 element fixture; production uses the dialect's own ceiling.
	 */
	maxInListSize?: number;
}

/**
 * `ParamCollector.bind` is the only thing in this file that appends to `params`, and the `param`
 * branch of `compileExpr` is the only thing that reads a value. Together with the IR having no raw
 * node, that means a value cannot reach `text` -- it is structural, not a convention we maintain.
 *
 * Identifiers are the other half. They are never escaped-from-user-input: a filter key can only
 * select a column out of the resolved mapping, so by the time a name gets here it came from code.
 * Quoting is belt and braces.
 */
class ParamCollector {
	readonly params: BoundParam[] = [];

	constructor(private readonly dialect: Dialect) {}

	bind(param: BoundParam): string {
		const placeholder = this.dialect.placeholder(this.params.length, param);
		this.params.push(param);
		return placeholder;
	}
}

interface Scope {
	/** Write statements do not alias their target, so their columns compile unqualified. */
	bareColumns?: boolean;
}

const compileExpr = (
	expr: Expr,
	dialect: Dialect,
	params: ParamCollector,
	scope: Scope = {}
): string => {
	switch (expr.kind) {
		case 'column':
			return scope.bareColumns
				? dialect.quoteIdentifier(expr.column)
				: `${dialect.quoteIdentifier(expr.table)}.${dialect.quoteIdentifier(expr.column)}`;
		case 'param':
			return params.bind({ value: expr.value, type: expr.type, meta: expr.meta });
		case 'lower':
			return `LOWER(${compileExpr(expr.operand, dialect, params, scope)})`;
		case 'countStar':
			return dialect.countExpression;
		case 'literalOne':
			return '1';
	}
};

const qualifiedName = (table: TableRef, dialect: Dialect) =>
	table.schema
		? `${dialect.quoteIdentifier(table.schema)}.${dialect.quoteIdentifier(table.name)}`
		: dialect.quoteIdentifier(table.name);

const compileTableRef = (table: TableRef, dialect: Dialect) => {
	return `${qualifiedName(table, dialect)} ${dialect.quoteIdentifier(table.alias)}`;
};

const compileInList = (
	predicate: Extract<Predicate, { kind: 'in' }>,
	dialect: Dialect,
	params: ParamCollector,
	options: CompileOptions,
	scope: Scope
): string => {
	const operand = compileExpr(predicate.operand, dialect, params, scope);

	// An empty IN list is a syntax error everywhere, and the semantics are known anyway.
	if (predicate.values.length === 0) return predicate.negated ? '1 = 1' : '1 = 0';

	const chunkSize = options.maxInListSize ?? dialect.maxBindParameters;
	const chunks: string[] = [];

	for (let i = 0; i < predicate.values.length; i += chunkSize) {
		const values = predicate.values
			.slice(i, i + chunkSize)
			.map((value) => compileExpr(value, dialect, params, scope));
		chunks.push(`${operand} ${predicate.negated ? 'NOT IN' : 'IN'} (${values.join(', ')})`);
	}

	if (chunks.length === 1) return chunks[0];

	// Over the parameter ceiling. NOT IN has to be ANDed, since "in none of the chunks" is what
	// the user asked for, where IN is ORed.
	return `(${chunks.join(predicate.negated ? ' AND ' : ' OR ')})`;
};

const compilePredicate = (
	predicate: Predicate,
	dialect: Dialect,
	params: ParamCollector,
	options: CompileOptions,
	scope: Scope = {}
): string => {
	switch (predicate.kind) {
		case 'true':
			return '1 = 1';
		case 'false':
			return '1 = 0';
		case 'compare':
			return `${compileExpr(predicate.left, dialect, params, scope)} ${predicate.op} ${compileExpr(
				predicate.right,
				dialect,
				params
			)}`;
		case 'isNull':
			return `${compileExpr(predicate.operand, dialect, params, scope)} IS ${
				predicate.negated ? 'NOT NULL' : 'NULL'
			}`;
		case 'in':
			return compileInList(predicate, dialect, params, options, scope);
		case 'like': {
			const operand =
				predicate.caseInsensitive && !dialect.supportsNativeIlike
					? `LOWER(${compileExpr(predicate.operand, dialect, params, scope)})`
					: compileExpr(predicate.operand, dialect, params, scope);
			const pattern =
				predicate.caseInsensitive && !dialect.supportsNativeIlike
					? `LOWER(${compileExpr(predicate.pattern, dialect, params, scope)})`
					: compileExpr(predicate.pattern, dialect, params, scope);
			const operator = predicate.caseInsensitive && dialect.supportsNativeIlike ? 'ILIKE' : 'LIKE';

			return `${operand} ${predicate.negated ? 'NOT ' : ''}${operator} ${pattern}`;
		}
		case 'and':
			return `(${predicate.operands
				.map((operand) => compilePredicate(operand, dialect, params, options, scope))
				.join(' AND ')})`;
		case 'or':
			return `(${predicate.operands
				.map((operand) => compilePredicate(operand, dialect, params, options, scope))
				.join(' OR ')})`;
		case 'not':
			return `NOT (${compilePredicate(predicate.operand, dialect, params, options, scope)})`;
		case 'exists':
			if (scope.bareColumns) {
				throw new Error(
					'A write predicate cannot contain an EXISTS: write statements do not alias their ' +
						'target, so a correlated subquery has nothing to correlate against.'
				);
			}
			return `${predicate.negated ? 'NOT EXISTS' : 'EXISTS'} (${compileSelect(
				predicate.select,
				dialect,
				params,
				options
			)})`;
	}
};

const validateRowCount = (value: number, what: string) => {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`${what} must be a non-negative integer, got ${value}.`);
	}
	return value;
};

/**
 * Compiles one entry of a SELECT list, wrapping it where the driver could not read it faithfully.
 *
 * A wrapped column is an expression rather than a column, so it arrives with no name for the driver
 * to key the row by -- it has to be aliased back even where the plan asked for no alias.
 */
const readBack = (
	expr: Expr,
	as: string | undefined,
	dialect: Dialect,
	params: ParamCollector
): string => {
	const compiled = compileExpr(expr, dialect, params);

	const read =
		expr.kind === 'column' && dialect.readExpression
			? dialect.readExpression(compiled, expr.type)
			: compiled;

	const alias = as ?? (read === compiled ? undefined : (expr as { column: string }).column);

	return alias ? `${read} AS ${dialect.quoteIdentifier(alias)}` : read;
};

const compileSelect = (
	node: SelectNode,
	dialect: Dialect,
	params: ParamCollector,
	options: CompileOptions
): string => {
	const columns = node.columns.map(({ expr, as }) => readBack(expr, as, dialect, params)).join(', ');

	const parts = [`SELECT ${columns}`, `FROM ${compileTableRef(node.from, dialect)}`];

	for (const join of node.joins) {
		parts.push(
			`${join.type === 'inner' ? 'INNER JOIN' : 'LEFT JOIN'} ${compileTableRef(
				join.table,
				dialect
			)} ON ${compilePredicate(join.on, dialect, params, options)}`
		);
	}

	if (node.where && node.where.kind !== 'true') {
		parts.push(`WHERE ${compilePredicate(node.where, dialect, params, options)}`);
	}

	if (node.orderBy.length) {
		parts.push(
			`ORDER BY ${node.orderBy
				.map((item) => dialect.compileOrderByItem(compileExpr(item.expr, dialect, params), item))
				.join(', ')}`
		);
	}

	const limit = node.limit === undefined ? undefined : validateRowCount(node.limit, 'limit');
	const offset = node.offset === undefined ? undefined : validateRowCount(node.offset, 'offset');

	if ((limit !== undefined || offset !== undefined) && dialect.requiresOrderByForPagination) {
		if (!node.orderBy.length) {
			throw new Error(
				`${dialect.name} cannot page without an ORDER BY. The planner should have appended the primary key.`
			);
		}
	}

	const pagination = dialect.compilePagination(limit, offset);
	if (pagination) parts.push(pagination);

	return parts.join(' ');
};

const compileInsert = (node: InsertNode, dialect: Dialect, params: ParamCollector): string => {
	const quote = (name: string) => dialect.quoteIdentifier(name);

	return dialect.compileInsert({
		table: qualifiedName(node.into, dialect),
		columns: node.columns.map(quote).join(', '),
		values: node.rows
			.map((row) => `(${row.map((value) => compileExpr(value, dialect, params)).join(', ')})`)
			.join(', '),
		returning: node.returning,
		quote,
	});
};

/** Write predicates compile with unqualified column names. See UpdateNode. */
const WRITE: Scope = { bareColumns: true };

const compileUpdate = (
	node: UpdateNode,
	dialect: Dialect,
	params: ParamCollector,
	options: CompileOptions
): string => {
	if (node.set.length === 0) {
		throw new Error('Refusing to compile an UPDATE that sets no columns.');
	}

	// Assignments bind before the predicate, so parameter order matches the text.
	const assignments = node.set
		.map(
			({ column, value }) =>
				`${dialect.quoteIdentifier(column)} = ${compileExpr(value, dialect, params, WRITE)}`
		)
		.join(', ');

	const where = compilePredicate(node.where, dialect, params, options, WRITE);

	return `UPDATE ${qualifiedName(node.table, dialect)} SET ${assignments} WHERE ${where}`;
};

const compileDelete = (
	node: DeleteNode,
	dialect: Dialect,
	params: ParamCollector,
	options: CompileOptions
): string =>
	`DELETE FROM ${qualifiedName(node.from, dialect)} WHERE ${compilePredicate(
		node.where,
		dialect,
		params,
		options,
		WRITE
	)}`;

export const compile = (
	node: Statement,
	dialect: Dialect,
	options: CompileOptions = {}
): SqlFragment => {
	const params = new ParamCollector(dialect);

	const text =
		node.kind === 'select'
			? compileSelect(node, dialect, params, options)
			: node.kind === 'insert'
				? compileInsert(node, dialect, params)
				: node.kind === 'update'
					? compileUpdate(node, dialect, params, options)
					: compileDelete(node, dialect, params, options);

	return { text, params: params.params };
};
