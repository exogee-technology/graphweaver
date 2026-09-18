import { AliasAllocator, and, param } from '../ir/builders';
import { filterToPredicate } from '../filter/filter-to-ir';
import type { Expr, SelectNode } from '../ir/nodes';
import type { ResolvedEntity } from '../mapping/types';
import { ROOT_ALIAS, selectListFor } from './select';

/** The alias the parent key comes back under, whichever shape produced it. */
export const RELATED_KEY = '__gw_rel';

export interface RelatedPlan {
	select: SelectNode;
	/**
	 * True when the shape can return the same record more than once -- once per parent it matched.
	 * Those rows are grouped by primary key and their keys collected.
	 */
	grouped: boolean;
}

/**
 * Plans `findByRelatedId`, which core's dataloader uses for every relationship field.
 *
 * `relatedField` is a field on the entity being found that points back at the parents, and
 * `relatedIds` are the parent primary keys. The result carries the parent key under RELATED_KEY so
 * the provider can hand it to core out of band, rather than hydrating the relationship just so the
 * loader can read a key back out of it.
 */
export const planFindByRelatedId = (
	entity: ResolvedEntity,
	relatedField: string,
	relatedIds: readonly unknown[],
	filter?: unknown,
	include?: ReadonlySet<string>
): RelatedPlan => {
	const relationship = entity.relationships.get(relatedField);

	if (!relationship) {
		throw new Error(
			`'${relatedField}' is not a relationship on '${entity.name}', so it cannot be loaded by ` +
				`related id. Known relationships: ${[...entity.relationships.keys()].join(', ') || '(none)'}.`
		);
	}

	const aliases = new AliasAllocator();
	const columns = selectListFor(entity, ROOT_ALIAS, include);
	const where = filterToPredicate(entity, filter, ROOT_ALIAS, aliases);
	const from = { schema: entity.schema, name: entity.table, alias: ROOT_ALIAS };
	const orderBy = [
		{
			expr: {
				kind: 'column' as const,
				table: ROOT_ALIAS,
				column: entity.primaryKey.name,
				type: entity.primaryKey.type,
			},
			direction: 'ASC' as const,
		},
	];

	// Many to one. The foreign key is on this table, so there is nothing to join: the parent key
	// is already sitting on every row. This is the common case and the one worth keeping cheap.
	if (relationship.kind === 'manyToOne') {
		const foreignKey: Expr = {
			kind: 'column',
			table: ROOT_ALIAS,
			column: relationship.foreignKey.name,
			type: relationship.foreignKey.type,
		};

		return {
			grouped: false,
			select: {
				kind: 'select',
				columns: [...columns, { expr: foreignKey, as: RELATED_KEY }],
				from,
				joins: [],
				where: and([
					where,
					{
						kind: 'in',
						operand: foreignKey,
						values: relatedIds.map((id) => param(id, relationship.foreignKey.type)),
						negated: false,
					},
				]),
				orderBy,
			},
		};
	}

	// One to many, inverted: find the rows whose related records are in the batch.
	if (relationship.kind === 'oneToMany') {
		const target = relationship.target();
		const subAlias = aliases.next('s');
		const targetKey: Expr = {
			kind: 'column',
			table: subAlias,
			column: target.primaryKey.name,
			type: target.primaryKey.type,
		};

		return {
			grouped: true,
			select: {
				kind: 'select',
				columns: [...columns, { expr: targetKey, as: RELATED_KEY }],
				from,
				joins: [
					{
						type: 'inner',
						table: { schema: target.schema, name: target.table, alias: subAlias },
						on: {
							kind: 'compare',
							op: '=',
							left: {
								kind: 'column',
								table: subAlias,
								column: relationship.targetForeignKey().name,
								type: entity.primaryKey.type,
							},
							right: {
								kind: 'column',
								table: ROOT_ALIAS,
								column: entity.primaryKey.name,
								type: entity.primaryKey.type,
							},
						},
					},
				],
				where: and([
					where,
					{
						kind: 'in',
						operand: targetKey,
						values: relatedIds.map((id) => param(id, target.primaryKey.type)),
						negated: false,
					},
				]),
				orderBy,
			},
		};
	}

	// Many to many. Join the pivot only -- the related table itself is never needed, because the
	// parent key we want is the pivot column.
	const pivotAlias = aliases.next('p');
	const target = relationship.target();
	const pivotKey: Expr = {
		kind: 'column',
		table: pivotAlias,
		column: relationship.pivot.inverseJoinColumn,
		type: target.primaryKey.type,
	};

	return {
		grouped: true,
		select: {
			kind: 'select',
			columns: [...columns, { expr: pivotKey, as: RELATED_KEY }],
			from,
			joins: [
				{
					type: 'inner',
					table: {
						schema: relationship.pivot.schema,
						name: relationship.pivot.table,
						alias: pivotAlias,
					},
					on: {
						kind: 'compare',
						op: '=',
						left: {
							kind: 'column',
							table: pivotAlias,
							column: relationship.pivot.joinColumn,
							type: entity.primaryKey.type,
						},
						right: {
							kind: 'column',
							table: ROOT_ALIAS,
							column: entity.primaryKey.name,
							type: entity.primaryKey.type,
						},
					},
				},
			],
			where: and([
				where,
				{
					kind: 'in',
					operand: pivotKey,
					values: relatedIds.map((id) => param(id, target.primaryKey.type)),
					negated: false,
				},
			]),
			orderBy,
		},
	};
};
