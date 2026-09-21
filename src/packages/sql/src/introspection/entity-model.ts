import pluralize from 'pluralize';
import type { ColumnType } from '../ir/nodes';
import type { NamingStrategy } from '../mapping/naming';
import type { DatabaseSchemaIR, TableIR } from './schema-ir';
import { columnTypeForSqlType } from './sql-types';

/** What codegen writes out: one entity per table, with the storage mapping already worked out. */
export interface EntityModel {
	name: string;
	table: string;
	schema?: string;
	/** Emitted only when the naming strategy would not reproduce the real table name. */
	tableIsConventional: boolean;
	primaryKey: PropertyModel;
	properties: PropertyModel[];
	relationships: RelationshipModel[];
	/** The database does not generate the key, so the client has to supply it. */
	clientGeneratedPrimaryKeys: boolean;
}

export interface PropertyModel {
	property: string;
	column: string;
	/** Emitted only when the naming strategy would not reproduce the real column name. */
	isConventional: boolean;
	type: ColumnType;
	sqlType: string;
	nullable: boolean;
	autoIncrement: boolean;
	enumValues?: string[];
	isPrimaryKey: boolean;
}

export type RelationshipModel =
	| {
			kind: 'manyToOne';
			property: string;
			targetEntity: string;
			column: string;
			nullable: boolean;
			/** The field on the target that points back, once inverse sides are synthesised. */
			relatedField: string;
	  }
	| { kind: 'oneToMany'; property: string; targetEntity: string; relatedField: string }
	| {
			kind: 'manyToMany';
			property: string;
			targetEntity: string;
			relatedField: string;
			owning: boolean;
			through?: { table: string; schema?: string; joinColumn: string; inverseJoinColumn: string };
	  };

export interface BuildResult {
	entities: EntityModel[];
	/** Tables we could not model, with the reason. Reported rather than thrown. */
	errors: string[];
	warnings: string[];
}

const pascalCase = (value: string) =>
	value
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');

const camelCase = (value: string) => {
	const pascal = pascalCase(value);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

/**
 * Makes a database identifier safe to use as a TypeScript property.
 *
 * `constructor` and `__proto__` are the only names that genuinely break, so they get a prefix;
 * everything else just needs to be a valid identifier.
 */
const safeIdentifier = (value: string) => {
	let name = camelCase(value) || '_';
	if (/^\d/.test(name)) name = `_${name}`;
	if (name === 'constructor' || name === '__proto__') name = `$${name}`;
	return name;
};

/**
 * Names a many-to-one after the column that points at the other table, rather than after the table
 * it points at.
 *
 * Chinook's `Employee.ReportsTo` is the case that makes the difference. Named after its target it
 * is `employee`, which says nothing on an entity that is already an employee; named after its
 * column it is `reportsTo`, which is the actual relationship. `Customer.SupportRepId` is the same
 * story -- `supportRep`, not `employee`. Where the two rules agree, as in `Album.ArtistId`, the
 * answer is `artist` either way, and two keys to the same table stop colliding for free.
 *
 * The trailing `Id` goes because `artistId` is the foreign key and `artist` is the thing it
 * resolves to. A column called nothing but `id` has no name of its own to offer, so that falls back
 * to the table being referenced.
 */
const propertyForForeignKey = (column: string, referencedTable: string) => {
	const identifier = safeIdentifier(column);

	// `Id$` rather than a case insensitive match: camel casing capitalises a genuine suffix, so
	// `ArtistId` and `artist_id` both arrive as `artistId`, while `paid` keeps its last two
	// letters.
	const stripped = identifier === 'id' ? '' : identifier.replace(/Id$/, '');

	return stripped || safeIdentifier(pluralize.singular(referencedTable));
};

const dedupe = (name: string, taken: Set<string>) => {
	if (!taken.has(name)) {
		taken.add(name);
		return name;
	}

	for (let suffix = 2; ; suffix++) {
		const candidate = `${name}_${suffix}`;
		if (!taken.has(candidate)) {
			taken.add(candidate);
			return candidate;
		}
	}
};

const singleColumnForeignKeys = (table: TableIR) =>
	table.foreignKeys.filter((foreignKey) => foreignKey.columns.length === 1);

/**
 * A pivot is a table that is *only* a join: a composite key of exactly two columns, both of which
 * are single-column foreign keys, and nothing else.
 *
 * This is stricter than the MikroORM importer, which allows extra non-key columns. A join table
 * carrying its own data -- a `created_at`, a `position` -- is almost always something the user
 * wants to see and query, so it is imported as an ordinary entity with two many-to-ones instead.
 */
const isPivotTable = (table: TableIR) => {
	if (!table.primaryKey || table.primaryKey.columns.length !== 2) return false;
	if (table.columns.length !== 2) return false;

	const foreignKeys = singleColumnForeignKeys(table);
	if (foreignKeys.length !== 2) return false;

	return table.primaryKey.columns.every((column) =>
		foreignKeys.some((foreignKey) => foreignKey.columns[0] === column)
	);
};

/**
 * Turns a schema into the entity models codegen emits.
 *
 * Replaces the five post-processing passes in MikroORM's importer. There is only one output class
 * per table now, so the whole "data entity plus schema entity" reconciliation disappears.
 */
export const buildEntityModels = (
	schema: DatabaseSchemaIR,
	naming: NamingStrategy
): BuildResult => {
	const errors: string[] = [];
	const warnings = [...schema.warnings];

	const pivots = schema.tables.filter(isPivotTable);
	const pivotNames = new Set(pivots.map((table) => table.name));
	const modelled = schema.tables.filter((table) => !pivotNames.has(table.name));

	// Name everything first, so relationships can refer to entities by their final names.
	const entityNames = new Set<string>();
	const entityByTable = new Map<string, EntityModel>();

	for (const table of modelled) {
		if (!table.primaryKey || table.primaryKey.columns.length === 0) {
			errors.push(
				`Skipping '${table.name}': it has no primary key, and the SQL provider needs a single column one.`
			);
			continue;
		}

		if (table.primaryKey.columns.length > 1) {
			errors.push(
				`Skipping '${table.name}': it has a composite primary key (${table.primaryKey.columns.join(
					', '
				)}), which the SQL provider does not support.`
			);
			continue;
		}

		const name = dedupe(pascalCase(pluralize.singular(table.name)), entityNames);
		const foreignKeyColumns = new Set(
			singleColumnForeignKeys(table).map((foreignKey) => foreignKey.columns[0])
		);

		const taken = new Set<string>();
		const properties: PropertyModel[] = [];
		let primaryKey: PropertyModel | undefined;

		for (const column of table.columns) {
			// A foreign key column becomes a relationship rather than a scalar property.
			if (foreignKeyColumns.has(column.name) && column.name !== table.primaryKey.columns[0]) {
				continue;
			}

			const property = dedupe(safeIdentifier(column.name), taken);
			const isPrimaryKey = column.name === table.primaryKey.columns[0];

			const model: PropertyModel = {
				property,
				column: column.name,
				isConventional: naming.columnName(property) === column.name,
				type: columnTypeForSqlType(schema.dialect, column),
				sqlType: column.fullType,
				nullable: column.nullable,
				autoIncrement: column.autoIncrement,
				enumValues: column.enumValues,
				isPrimaryKey,
			};

			properties.push(model);
			if (isPrimaryKey) primaryKey = model;
		}

		if (!primaryKey) {
			errors.push(`Skipping '${table.name}': its primary key column is also a foreign key.`);
			continue;
		}

		entityByTable.set(table.name, {
			name,
			table: table.name,
			schema: table.schema === schema.defaultSchema ? undefined : table.schema,
			tableIsConventional: naming.tableName(name) === table.name,
			primaryKey,
			properties,
			relationships: [],
			// Nothing generates the value, so the client must supply it.
			clientGeneratedPrimaryKeys: !isAutoGenerated(primaryKey, table),
		});
	}

	buildManyToOne(modelled, entityByTable, naming, errors);
	buildManyToMany(pivots, entityByTable, errors);

	return { entities: [...entityByTable.values()], errors, warnings };
};

const isAutoGenerated = (primaryKey: PropertyModel, table: TableIR) => {
	const column = table.columns.find((entry) => entry.name === primaryKey.column);
	return Boolean(column?.autoIncrement || column?.defaultIsExpression);
};

const buildManyToOne = (
	tables: TableIR[],
	entityByTable: Map<string, EntityModel>,
	naming: NamingStrategy,
	errors: string[]
) => {
	for (const table of tables) {
		const entity = entityByTable.get(table.name);
		if (!entity) continue;

		const taken = new Set([
			...entity.properties.map((property) => property.property),
			...entity.relationships.map((relationship) => relationship.property),
		]);

		for (const foreignKey of table.foreignKeys) {
			if (foreignKey.columns.length > 1) {
				errors.push(
					`Skipping the relationship '${table.name}.${foreignKey.name}': it is a composite ` +
						`foreign key, which the SQL provider does not support.`
				);
				continue;
			}

			const target = entityByTable.get(foreignKey.referencedTable);
			if (!target) continue;

			// A foreign key must point at the target's primary key for us to model it as one.
			if (foreignKey.referencedColumns[0] !== target.primaryKey.column) {
				errors.push(
					`Skipping the relationship between '${table.name}' and '${foreignKey.referencedTable}': ` +
						`it references '${foreignKey.referencedColumns[0]}', which is not that table's primary key.`
				);
				continue;
			}

			const property = dedupe(
				propertyForForeignKey(foreignKey.columns[0], foreignKey.referencedTable),
				taken
			);

			const column = table.columns.find((entry) => entry.name === foreignKey.columns[0]);
			const inverse = dedupe(
				safeIdentifier(pluralize.plural(table.name)),
				new Set(target.relationships.map((relationship) => relationship.property))
			);

			entity.relationships.push({
				kind: 'manyToOne',
				property,
				targetEntity: target.name,
				column: foreignKey.columns[0],
				nullable: column?.nullable ?? true,
				relatedField: inverse,
			});

			target.relationships.push({
				kind: 'oneToMany',
				property: inverse,
				targetEntity: entity.name,
				relatedField: property,
			});

			void naming;
		}
	}
};

const buildManyToMany = (
	pivots: TableIR[],
	entityByTable: Map<string, EntityModel>,
	errors: string[]
) => {
	for (const pivot of pivots) {
		// Somebody has to own the pivot, and nothing in the schema says who should. Column order
		// inside the pivot's primary key looks like a signal but is really just how whoever wrote
		// the DDL happened to type it, and it is not reliably reported either.
		//
		// So the rule is simply alphabetical by referenced table. It is arbitrary, but it is
		// *stable*: the same schema always generates the same code, which is what actually matters
		// for anything people commit and diff.
		const [first, second] = singleColumnForeignKeys(pivot).sort((left, right) =>
			left.referencedTable.localeCompare(right.referencedTable)
		);
		const owner = entityByTable.get(first.referencedTable);
		const other = entityByTable.get(second.referencedTable);

		if (!owner || !other) {
			errors.push(
				`Skipping the pivot table '${pivot.name}': one of the tables it joins was itself skipped.`
			);
			continue;
		}

		const ownerProperty = dedupe(
			safeIdentifier(pluralize.plural(second.referencedTable)),
			new Set(owner.relationships.map((relationship) => relationship.property))
		);
		const otherProperty = dedupe(
			safeIdentifier(pluralize.plural(first.referencedTable)),
			new Set(other.relationships.map((relationship) => relationship.property))
		);

		owner.relationships.push({
			kind: 'manyToMany',
			property: ownerProperty,
			targetEntity: other.name,
			relatedField: otherProperty,
			owning: true,
			through: {
				table: pivot.name,
				schema: pivot.schema,
				joinColumn: first.columns[0],
				inverseJoinColumn: second.columns[0],
			},
		});

		other.relationships.push({
			kind: 'manyToMany',
			property: otherProperty,
			targetEntity: owner.name,
			relatedField: ownerProperty,
			owning: false,
		});
	}
};
