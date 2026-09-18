import { AliasAllocator, and, exists, FALSE, lower, not, or, param, TRUE } from '../ir/builders';
import { filterCompatibility } from './compatibility';
import { EXISTS_SUFFIX } from './operators';
import type { CompareOperator, Expr, Predicate, SelectNode, TableAlias } from '../ir/nodes';
import type {
	ResolvedColumn,
	ResolvedEntity,
	ResolvedManyToOne,
	ResolvedRelationship,
} from '../mapping/types';
import { UnknownFieldError } from '../mapping/types';
import type { Operator } from './operators';
import { splitFilterKey } from './operators';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isIterable = (value: unknown): value is Iterable<unknown> =>
	typeof value === 'object' && value !== null && Symbol.iterator in (value as object);

const col = (entity: ResolvedEntity, alias: TableAlias, column: ResolvedColumn): Expr => ({
	kind: 'column',
	table: alias,
	column: column.name,
	type: column.type,
});

const tableRefFor = (entity: ResolvedEntity, alias: TableAlias) => ({
	schema: entity.schema,
	name: entity.table,
	alias,
});

/** A subquery that only ever asks "is there a row", so it selects the cheapest thing possible. */
const existsShell = (entity: ResolvedEntity, alias: TableAlias): SelectNode => ({
	kind: 'select',
	columns: [{ expr: { kind: 'literalOne' } }],
	from: tableRefFor(entity, alias),
	joins: [],
	orderBy: [],
});

const COMPARE_OPERATORS: Partial<Record<Operator, CompareOperator>> = {
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
};

const columnPredicate = (
	entity: ResolvedEntity,
	alias: TableAlias,
	column: ResolvedColumn,
	operator: Operator | undefined,
	value: unknown
): Predicate => {
	const operand = col(entity, alias, column);

	switch (operator) {
		case undefined:
			// An explicit null is a real thing to filter on, not an absent filter.
			if (value === null) return { kind: 'isNull', operand, negated: false };
			return {
				kind: 'compare',
				op: '=',
				left: operand,
				right: param(value, column.type, column.meta),
			};

		case 'ne':
			if (value === null) return { kind: 'isNull', operand, negated: true };
			// Note this excludes NULL rows, per SQL three-valued logic. That matches the existing
			// MikroORM behaviour, so it is preserved deliberately rather than "fixed".
			return {
				kind: 'compare',
				op: '<>',
				left: operand,
				right: param(value, column.type, column.meta),
			};

		case 'null':
			return { kind: 'isNull', operand, negated: !value };

		case 'notnull':
			return { kind: 'isNull', operand, negated: Boolean(value) };

		case 'in':
		case 'nin': {
			// Accept any iterable, not just an array: core hands us a MapIterator from
			// resolvers.ts createOrUpdateMany. Belt and braces for older core versions.
			const values = Array.isArray(value) ? value : isIterable(value) ? Array.from(value) : [value];

			return {
				kind: 'in',
				operand,
				values: values.map((entry) => param(entry, column.type, column.meta)),
				negated: operator === 'nin',
			};
		}

		case 'like':
		case 'ilike':
			return {
				kind: 'like',
				operand,
				pattern: param(value, column.type, column.meta),
				caseInsensitive: operator === 'ilike',
				negated: false,
			};

		default: {
			const op = COMPARE_OPERATORS[operator];
			if (!op) throw new Error(`Unsupported operator '${operator}'.`);
			return { kind: 'compare', op, left: operand, right: param(value, column.type, column.meta) };
		}
	}
};

/**
 * `{ artist: { id: 5 } }` and `{ artist: { id_in: [...] } }` need no subquery at all, because the
 * foreign key is already on this table. This is the shape access control filters and core's
 * cross-datasource flattening both produce, so it is the hottest path there is.
 */
const collapseManyToOneOnPrimaryKey = (
	entity: ResolvedEntity,
	alias: TableAlias,
	relationship: ResolvedManyToOne,
	value: Record<string, unknown>
): Predicate | undefined => {
	const target = relationship.target();
	const keys = Object.keys(value);
	if (keys.length !== 1) return undefined;

	const [key] = keys;
	const primaryKey = target.primaryKey.property;
	if (key !== primaryKey && key !== `${primaryKey}_in`) return undefined;

	// The foreign key carries the related primary key's type, not its own declared one.
	const foreignKey: ResolvedColumn = {
		...relationship.foreignKey,
		type: target.primaryKey.type,
	};

	return columnPredicate(
		entity,
		alias,
		foreignKey,
		key === primaryKey ? undefined : 'in',
		value[key]
	);
};

/**
 * Whether a to-many filter is the MikroORM "no related rows" idiom rather than a condition on them.
 *
 * Off unless `SqlDataProvider.treatRelationshipNullAsAbsent` is set, and deliberately narrow even
 * then: only a filter that is exactly one `_null: true` on a column the database will not let be
 * null. Anything else -- a nullable column, a second condition, a nested `_or` -- keeps its literal
 * meaning, because there the literal meaning is something a caller could plausibly want.
 */
const isAbsenceFilter = (target: ResolvedEntity, value: Record<string, unknown>) => {
	if (!filterCompatibility.treatRelationshipNullAsAbsent) return false;

	const keys = Object.keys(value);
	if (keys.length !== 1 || !keys[0].endsWith('_null') || value[keys[0]] !== true) return false;

	const column = target.columns.get(keys[0].slice(0, -'_null'.length));

	return Boolean(column) && !column!.nullable;
};

const relationshipPredicate = (
	entity: ResolvedEntity,
	alias: TableAlias,
	relationship: ResolvedRelationship,
	value: unknown,
	aliases: AliasAllocator
): Predicate => {
	const target = relationship.target();

	if (relationship.kind === 'manyToOne') {
		const foreignKey = col(entity, alias, relationship.foreignKey);

		// `{ artist: null }` means "has no artist", which the foreign key answers directly.
		if (value === null) return { kind: 'isNull', operand: foreignKey, negated: false };

		if (!isPlainObject(value)) {
			throw new Error(
				`Filter on relationship '${entity.name}.${relationship.property}' must be an object or null.`
			);
		}

		// `{ artist: {} }` means "has an artist".
		if (Object.keys(value).length === 0) {
			return { kind: 'isNull', operand: foreignKey, negated: true };
		}

		const collapsed = collapseManyToOneOnPrimaryKey(entity, alias, relationship, value);
		if (collapsed) return collapsed;

		const subAlias = aliases.next('s');
		const select = existsShell(target, subAlias);
		select.where = and([
			{
				kind: 'compare',
				op: '=',
				left: col(target, subAlias, target.primaryKey),
				right: foreignKey,
			},
			filterToPredicate(target, value, subAlias, aliases),
		]);

		return exists(select);
	}

	if (value === null) {
		throw new Error(
			`Filter on to-many relationship '${entity.name}.${relationship.property}' cannot be null. ` +
				`Use '${relationship.property}${EXISTS_SUFFIX}: false' to match rows with no related ` +
				`records.`
		);
	}

	if (!isPlainObject(value)) {
		throw new Error(
			`Filter on relationship '${entity.name}.${relationship.property}' must be an object.`
		);
	}

	// Only when asked for. See `SqlDataProvider.treatRelationshipNullAsAbsent`.
	if (isAbsenceFilter(target, value)) {
		return not(relationshipPredicate(entity, alias, relationship, {}, aliases));
	}

	if (relationship.kind === 'oneToMany') {
		const subAlias = aliases.next('s');
		const select = existsShell(target, subAlias);
		select.where = and([
			{
				kind: 'compare',
				op: '=',
				left: col(target, subAlias, relationship.targetForeignKey()),
				right: col(entity, alias, entity.primaryKey),
			},
			filterToPredicate(target, value, subAlias, aliases),
		]);

		return exists(select);
	}

	// Many to many. The pivot is the one place a JOIN appears inside a filter, and it is safe
	// because we are inside EXISTS: row multiplication in here cannot reach the outer result.
	const pivotAlias = aliases.next('p');
	const subAlias = aliases.next('s');

	const select: SelectNode = {
		kind: 'select',
		columns: [{ expr: { kind: 'literalOne' } }],
		from: {
			schema: relationship.pivot.schema,
			name: relationship.pivot.table,
			alias: pivotAlias,
		},
		joins: [
			{
				type: 'inner',
				table: tableRefFor(target, subAlias),
				on: {
					kind: 'compare',
					op: '=',
					left: col(target, subAlias, target.primaryKey),
					right: {
						kind: 'column',
						table: pivotAlias,
						column: relationship.pivot.inverseJoinColumn,
						type: target.primaryKey.type,
					},
				},
			},
		],
		orderBy: [],
	};

	select.where = and([
		{
			kind: 'compare',
			op: '=',
			left: {
				kind: 'column',
				table: pivotAlias,
				column: relationship.pivot.joinColumn,
				type: entity.primaryKey.type,
			},
			right: col(entity, alias, entity.primaryKey),
		},
		filterToPredicate(target, value, subAlias, aliases),
	]);

	return exists(select);
};

/**
 * Translates a Graphweaver `Filter` into a `Predicate`.
 *
 * Nested relationship filters become correlated EXISTS subqueries rather than joins. The deciding
 * reason is negation: under a join, `_not: { tracks: { name: 'x' } }` compiles to
 * `NOT (s1.name = 'x')`, which reads as "has some track not called x" -- not what was written.
 * EXISTS gives `NOT EXISTS (...)`, which is. Avoiding joins also means no row multiplication, so
 * we never need the blanket SELECT DISTINCT the MikroORM provider applies, which in turn avoids
 * SQL Server's ban on DISTINCT over text columns and Postgres's over json.
 */
export const filterToPredicate = (
	entity: ResolvedEntity,
	filter: unknown,
	alias: TableAlias,
	aliases: AliasAllocator
): Predicate => {
	if (filter === undefined || filter === null) return TRUE;

	if (!isPlainObject(filter)) {
		throw new Error(`Filter for '${entity.name}' must be an object.`);
	}

	// Unwrap the accidental { filter: ... } wrapper core's createOrUpdateMany used to send, but
	// only when the entity has no field genuinely called `filter`.
	let source = filter;
	const keys = Object.keys(source);
	if (
		keys.length === 1 &&
		keys[0] === 'filter' &&
		!entity.columns.has('filter') &&
		!entity.relationships.has('filter') &&
		isPlainObject(source.filter)
	) {
		source = source.filter;
	}

	const predicates: Predicate[] = [];

	for (const [key, value] of Object.entries(source)) {
		if (value === undefined) continue;

		if (key === '_and' || key === '_or') {
			if (!Array.isArray(value)) throw new Error(`'${key}' must be an array.`);
			const operands = value.map((entry) => filterToPredicate(entity, entry, alias, aliases));
			predicates.push(key === '_and' ? and(operands) : or(operands));
			continue;
		}

		if (key === '_not') {
			predicates.push(not(filterToPredicate(entity, value, alias, aliases)));
			continue;
		}

		const relationship = entity.relationships.get(key);
		if (relationship) {
			predicates.push(relationshipPredicate(entity, alias, relationship, value, aliases));
			continue;
		}

		// `{ tracks_exists: false }` -- has no related rows. The filter grammar otherwise has no
		// way to ask this: `_not: { tracks: {} }` says it, but core strips empty filter objects
		// before a provider ever sees one, so through the API it matches everything instead.
		//
		// A column genuinely named `tracks_exists` wins, since it is a field rather than an
		// operator on one.
		if (!entity.columns.has(key) && key.endsWith(EXISTS_SUFFIX)) {
			const related = entity.relationships.get(key.slice(0, -EXISTS_SUFFIX.length));

			if (related) {
				if (typeof value !== 'boolean') {
					throw new Error(
						`'${entity.name}.${key}' takes true or false, not ${JSON.stringify(value)}. ` +
							`To filter the related rows themselves, use '${related.property}' instead.`
					);
				}

				// An empty filter on the relationship is the correlation and nothing else, which is
				// exactly "at least one related row".
				const anyRelated = relationshipPredicate(entity, alias, related, {}, aliases);

				predicates.push(value ? anyRelated : not(anyRelated));
				continue;
			}
		}

		const split = splitFilterKey(
			key,
			(name) => entity.columns.has(name) || entity.relationships.has(name)
		);

		if (!split) {
			throw new UnknownFieldError(entity.name, key, [
				...entity.columns.keys(),
				...entity.relationships.keys(),
			]);
		}

		const column = entity.columns.get(split.field);
		if (!column) {
			throw new Error(
				`Operator '${split.operator}' is not supported on relationship '${entity.name}.${split.field}'.`
			);
		}

		predicates.push(columnPredicate(entity, alias, column, split.operator, value));
	}

	return and(predicates);
};

export { FALSE, TRUE, lower };
