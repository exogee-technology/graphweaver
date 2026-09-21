import { AliasAllocator } from '../ir/builders';
import { filterToPredicate } from '../filter/filter-to-ir';
import type { Expr, OrderByItem, SelectNode } from '../ir/nodes';
import type { ResolvedEntity } from '../mapping/types';

export type SortDirection = 'ASC' | 'DESC';

export interface PaginationOptions {
	orderBy?: Record<string, SortDirection>;
	limit?: number;
	offset?: number;
}

export const ROOT_ALIAS = 't0';

/**
 * The columns a find needs: every mapped column, plus the foreign key of each many-to-one, which
 * is how the relationship field resolves without hydrating anything.
 */
export const selectListFor = (
	entity: ResolvedEntity,
	alias: string,
	/** Properties of `select: false` columns to load anyway, from `withColumns`. */
	include: ReadonlySet<string> = new Set()
) => {
	const columns: { expr: Expr }[] = [];

	for (const column of entity.columns.values()) {
		// A `select: false` column stays filterable but is not loaded unless asked for. That is
		// what makes it safe to mark a password hash hidden: WHERE never needs the SELECT list.
		if (column.select === false && !include.has(column.property)) continue;

		columns.push({
			expr: { kind: 'column', table: alias, column: column.name, type: column.type },
		});
	}

	for (const relationship of entity.relationships.values()) {
		if (relationship.kind !== 'manyToOne') continue;
		columns.push({
			expr: {
				kind: 'column',
				table: alias,
				column: relationship.foreignKey.name,
				type: relationship.target().primaryKey.type,
			},
		});
	}

	return columns;
};

/**
 * Postgres puts NULLs last on ASC; everyone else puts them first. We normalise to the Postgres
 * reading so a query returns rows in the same order regardless of which database is underneath.
 */
const nullsFor = (direction: SortDirection, nullable: boolean): 'FIRST' | 'LAST' | undefined => {
	if (!nullable) return undefined;
	return direction === 'ASC' ? 'LAST' : 'FIRST';
};

export const planFind = (
	entity: ResolvedEntity,
	filter?: unknown,
	pagination?: PaginationOptions,
	include?: ReadonlySet<string>
): SelectNode => {
	const aliases = new AliasAllocator();
	const alias = ROOT_ALIAS;

	const orderBy: OrderByItem[] = [];

	for (const [property, direction] of Object.entries(pagination?.orderBy ?? {})) {
		const column = entity.columns.get(property);
		if (!column) {
			throw new Error(`Cannot order '${entity.name}' by '${property}': it is not a mapped column.`);
		}

		orderBy.push({
			expr: { kind: 'column', table: alias, column: column.name, type: column.type },
			direction,
			nulls: nullsFor(direction, column.nullable),
		});
	}

	// The primary key always goes on the end. It makes paging deterministic when the sort column
	// has ties, it is what `supportsPseudoCursorPagination` assumes, and SQL Server refuses
	// OFFSET/FETCH without an ORDER BY at all.
	const alreadySortingByPrimaryKey = orderBy.some(
		(item) => item.expr.kind === 'column' && item.expr.column === entity.primaryKey.name
	);

	if (!alreadySortingByPrimaryKey) {
		orderBy.push({
			expr: {
				kind: 'column',
				table: alias,
				column: entity.primaryKey.name,
				type: entity.primaryKey.type,
			},
			direction: 'ASC',
			nulls: nullsFor('ASC', entity.primaryKey.nullable),
		});
	}

	return {
		kind: 'select',
		columns: selectListFor(entity, alias, include),
		from: { schema: entity.schema, name: entity.table, alias },
		joins: [],
		where: filterToPredicate(entity, filter, alias, aliases),
		orderBy,
		limit: pagination?.limit,
		offset: pagination?.offset,
	};
};

/** COUNT aggregation. Same WHERE, no ordering, no paging. */
export const planCount = (entity: ResolvedEntity, filter?: unknown): SelectNode => {
	const aliases = new AliasAllocator();

	return {
		kind: 'select',
		columns: [{ expr: { kind: 'countStar' }, as: 'count' }],
		from: { schema: entity.schema, name: entity.table, alias: ROOT_ALIAS },
		joins: [],
		where: filterToPredicate(entity, filter, ROOT_ALIAS, aliases),
		orderBy: [],
	};
};
