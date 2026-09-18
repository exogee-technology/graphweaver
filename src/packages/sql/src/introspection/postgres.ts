import type {
	ColumnIR,
	DatabaseSchemaIR,
	EnumIR,
	ForeignKeyIR,
	IntrospectOptions,
	IntrospectionQuery,
	SchemaIntrospector,
	TableIR,
	UniqueIR,
} from './schema-ir';
import { applyTableFilter } from './schema-ir';

/**
 * Reads from `pg_catalog` rather than `information_schema`.
 *
 * The catalog exposes `attidentity` and `attgenerated`, which `information_schema` does not, and it
 * is markedly faster on a large database. The cost is slightly gnarlier SQL.
 */
const TABLES = `
	SELECT n.nspname AS schema_name,
	       c.relname AS table_name,
	       CASE WHEN c.relkind IN ('r', 'p') THEN 'table' ELSE 'view' END AS kind
	FROM pg_class c
	JOIN pg_namespace n ON n.oid = c.relnamespace
	WHERE c.relkind = ANY($2::char[])
	  AND n.nspname = ANY($1::text[])
	ORDER BY n.nspname, c.relname`;

const COLUMNS = `
	SELECT n.nspname                              AS schema_name,
	       c.relname                              AS table_name,
	       a.attname                              AS column_name,
	       a.attnum                               AS ordinal,
	       format_type(a.atttypid, a.atttypmod)   AS full_type,
	       t.typname                              AS data_type,
	       t.typtype                              AS type_kind,
	       NOT a.attnotnull                       AS nullable,
	       pg_get_expr(ad.adbin, ad.adrelid)      AS default_value,
	       a.attidentity                          AS identity,
	       a.attgenerated                         AS generated,
	       information_schema._pg_char_max_length(a.atttypid, a.atttypmod)   AS char_length,
	       information_schema._pg_numeric_precision(a.atttypid, a.atttypmod) AS numeric_precision,
	       information_schema._pg_numeric_scale(a.atttypid, a.atttypmod)     AS numeric_scale
	FROM pg_attribute a
	JOIN pg_class c        ON c.oid = a.attrelid
	JOIN pg_namespace n    ON n.oid = c.relnamespace
	JOIN pg_type t         ON t.oid = a.atttypid
	LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
	WHERE a.attnum > 0 AND NOT a.attisdropped
	  AND c.relkind = ANY($2::char[])
	  AND n.nspname = ANY($1::text[])
	ORDER BY n.nspname, c.relname, a.attnum`;

const CONSTRAINTS = `
	SELECT n.nspname   AS schema_name,
	       t.relname   AS table_name,
	       con.conname AS constraint_name,
	       con.contype AS constraint_type,
	       a.attname   AS column_name,
	       k.ord       AS ordinal
	FROM pg_constraint con
	JOIN pg_class t      ON t.oid = con.conrelid
	JOIN pg_namespace n  ON n.oid = t.relnamespace
	CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
	JOIN pg_attribute a  ON a.attrelid = t.oid AND a.attnum = k.attnum
	WHERE con.contype IN ('p', 'u') AND n.nspname = ANY($1::text[])
	ORDER BY n.nspname, t.relname, con.conname, k.ord`;

/**
 * `unnest(conkey, confkey) WITH ORDINALITY` is the only dependable way to keep a composite key's
 * two column lists aligned. `information_schema.constraint_column_usage` does not preserve the
 * pairing, which is a quiet way to generate a wrong relationship.
 */
const FOREIGN_KEYS = `
	SELECT con.conname  AS constraint_name,
	       n.nspname    AS schema_name,
	       t.relname    AS table_name,
	       a.attname    AS column_name,
	       fn.nspname   AS ref_schema,
	       ft.relname   AS ref_table,
	       fa.attname   AS ref_column,
	       k.ord        AS ordinal,
	       con.confdeltype AS on_delete,
	       con.confupdtype AS on_update
	FROM pg_constraint con
	JOIN pg_class t       ON t.oid  = con.conrelid
	JOIN pg_namespace n   ON n.oid  = t.relnamespace
	JOIN pg_class ft      ON ft.oid = con.confrelid
	JOIN pg_namespace fn  ON fn.oid = ft.relnamespace
	CROSS JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS k(attnum, fattnum, ord)
	JOIN pg_attribute a   ON a.attrelid  = t.oid  AND a.attnum  = k.attnum
	JOIN pg_attribute fa  ON fa.attrelid = ft.oid AND fa.attnum = k.fattnum
	WHERE con.contype = 'f' AND n.nspname = ANY($1::text[])
	ORDER BY con.conname, k.ord`;

const ENUMS = `
	SELECT n.nspname AS schema_name, t.typname AS enum_name, e.enumlabel AS value
	FROM pg_type t
	JOIN pg_enum e      ON e.enumtypid = t.oid
	JOIN pg_namespace n ON n.oid = t.typnamespace
	ORDER BY n.nspname, t.typname, e.enumsortorder`;

/**
 * Single-column CHECK constraints, which is the other way an enumeration reaches a Postgres column.
 *
 * A `TEXT ... CHECK (col IN ('a', 'b'))` is far more common in the wild than a real `CREATE TYPE`
 * enum, and it is what the MikroORM importer read, so dropping it would silently turn an existing
 * project's GraphQL enums into plain strings on migration.
 */
const CHECK_CONSTRAINTS = `
	SELECT n.nspname AS schema_name, t.relname AS table_name,
	       pg_get_constraintdef(con.oid) AS definition,
	       (SELECT a.attname FROM pg_attribute a
	        WHERE a.attrelid = t.oid AND a.attnum = con.conkey[1]) AS column_name,
	       array_length(con.conkey, 1) AS column_count
	FROM pg_constraint con
	JOIN pg_class t     ON t.oid = con.conrelid
	JOIN pg_namespace n ON n.oid = t.relnamespace
	WHERE con.contype = 'c' AND n.nspname = ANY($1::text[])`;

/**
 * Pulls the allowed values out of a CHECK definition, or returns nothing.
 *
 * Postgres rewrites `col IN ('a', 'b')` into `col = ANY (ARRAY['a'::text, 'b'::text])` before
 * storing it, so that is the shape that comes back. Anything else -- a range check, a regex, a
 * comparison between two columns -- is a constraint we have no business reading as an enum, hence
 * the deliberately narrow match.
 */
const CHECK_ENUM = /^CHECK \(+"?([^"\s=]+)"?\s*=\s*ANY\s*\(+ARRAY\[(.+?)\]\)+$/i;

export const enumValuesFromCheck = (definition: string, column: string): string[] | undefined => {
	const match = CHECK_ENUM.exec(definition.replace(/\s+/g, ' ').trim());
	if (!match || match[1] !== column) return undefined;

	const values = [...match[2].matchAll(/'((?:[^']|'')*)'(?:::[a-z ]+)?/gi)].map((literal) =>
		literal[1].replace(/''/g, "'")
	);

	return values.length ? values : undefined;
};

const key = (schema: unknown, table: unknown) => `${String(schema)}.${String(table)}`;

export const postgresIntrospector: SchemaIntrospector = {
	dialect: 'postgres',

	async introspect(query: IntrospectionQuery, options: IntrospectOptions = {}) {
		const schemas = options.schemas ?? ['public'];
		const relkinds = options.includeViews ? ['r', 'p', 'v', 'm'] : ['r', 'p'];
		const warnings: string[] = [];

		const [tableRows, columnRows, constraintRows, foreignKeyRows, enumRows, checkRows] =
			await Promise.all([
				query(TABLES, [schemas, relkinds]),
				query(COLUMNS, [schemas, relkinds]),
				query(CONSTRAINTS, [schemas]),
				query(FOREIGN_KEYS, [schemas]),
				query(ENUMS, []),
				query(CHECK_CONSTRAINTS, [schemas]),
			]);

		// Keyed by schema, table and column, since a CHECK only enumerates one column's values.
		const checkedValues = new Map<string, string[]>();
		for (const row of checkRows) {
			if (Number(row.column_count) !== 1 || !row.column_name) continue;

			const values = enumValuesFromCheck(String(row.definition), String(row.column_name));
			if (values) {
				checkedValues.set(`${key(row.schema_name, row.table_name)}.${row.column_name}`, values);
			}
		}

		const enumsByName = new Map<string, EnumIR>();
		for (const row of enumRows) {
			const name = String(row.enum_name);
			const existing = enumsByName.get(name) ?? {
				schema: row.schema_name ? String(row.schema_name) : undefined,
				name,
				values: [],
			};
			existing.values.push(String(row.value));
			enumsByName.set(name, existing);
		}

		const tables = new Map<string, TableIR>();
		for (const row of tableRows) {
			tables.set(key(row.schema_name, row.table_name), {
				schema: String(row.schema_name),
				name: String(row.table_name),
				kind: row.kind === 'table' ? 'table' : 'view',
				columns: [],
				foreignKeys: [],
				uniques: [],
			});
		}

		for (const row of columnRows) {
			const table = tables.get(key(row.schema_name, row.table_name));
			if (!table) continue;

			const defaultValue = row.default_value === null ? undefined : String(row.default_value);
			const dataType = String(row.data_type);

			const column: ColumnIR = {
				name: String(row.column_name),
				ordinal: Number(row.ordinal),
				dataType,
				fullType: String(row.full_type),
				length: row.char_length === null ? undefined : Number(row.char_length),
				precision: row.numeric_precision === null ? undefined : Number(row.numeric_precision),
				scale: row.numeric_scale === null ? undefined : Number(row.numeric_scale),
				nullable: row.nullable === true || row.nullable === 't',
				defaultValue,
				defaultIsExpression: Boolean(defaultValue && /\w\s*\(/.test(defaultValue)),
				// Both spellings of generated: an identity column, or the older serial pattern of a
				// plain integer defaulting to nextval().
				autoIncrement:
					row.identity === 'a' ||
					row.identity === 'd' ||
					Boolean(defaultValue?.startsWith('nextval(')),
				generated: row.generated === 's' ? 'stored' : undefined,
			};

			if (row.type_kind === 'e') {
				column.enumName = dataType;
				column.enumValues = enumsByName.get(dataType)?.values;
			} else {
				column.enumValues = checkedValues.get(
					`${key(row.schema_name, row.table_name)}.${row.column_name}`
				);
			}

			table.columns.push(column);
		}

		// Sort by the ordinal we selected rather than trusting the row order to survive the
		// driver. Column order inside a key is not cosmetic -- it decides which side of a pivot
		// owns a many-to-many, and which column of a composite key pairs with which -- so getting
		// it from the data rather than from an assumption is worth the few extra lines.
		const byOrdinal = <T extends { ordinal: unknown }>(rows: T[]) =>
			[...rows].sort((left, right) => Number(left.ordinal) - Number(right.ordinal));

		const constraintsByName = new Map<string, Record<string, unknown>[]>();
		for (const row of constraintRows) {
			const id = `${key(row.schema_name, row.table_name)}.${String(row.constraint_name)}`;
			constraintsByName.set(id, [...(constraintsByName.get(id) ?? []), row]);
		}

		for (const rows of constraintsByName.values()) {
			const [first] = rows;
			const table = tables.get(key(first.schema_name, first.table_name));
			if (!table) continue;

			const name = String(first.constraint_name);
			const columns = byOrdinal(rows as { ordinal: unknown }[]).map((row) =>
				String((row as Record<string, unknown>).column_name)
			);

			if (first.constraint_type === 'p') table.primaryKey = { name, columns };
			else table.uniques.push({ name, columns } satisfies UniqueIR);
		}

		const foreignKeysByName = new Map<string, Record<string, unknown>[]>();
		for (const row of foreignKeyRows) {
			const id = `${key(row.schema_name, row.table_name)}.${String(row.constraint_name)}`;
			foreignKeysByName.set(id, [...(foreignKeysByName.get(id) ?? []), row]);
		}

		for (const rows of foreignKeysByName.values()) {
			const [first] = rows;
			const table = tables.get(key(first.schema_name, first.table_name));
			if (!table) continue;

			const ordered = byOrdinal(rows as { ordinal: unknown }[]) as Record<string, unknown>[];

			table.foreignKeys.push({
				name: String(first.constraint_name),
				columns: ordered.map((row) => String(row.column_name)),
				referencedSchema: String(first.ref_schema),
				referencedTable: String(first.ref_table),
				referencedColumns: ordered.map((row) => String(row.ref_column)),
				onDelete: String(first.on_delete),
				onUpdate: String(first.on_update),
			} satisfies ForeignKeyIR);
		}

		// Foreign keys are ordered by name so the result does not depend on catalog order either.
		for (const table of tables.values()) {
			table.foreignKeys.sort((left, right) => left.name.localeCompare(right.name));
		}

		return {
			dialect: 'postgres',
			defaultSchema: 'public',
			tables: applyTableFilter([...tables.values()], options),
			enums: [...enumsByName.values()],
			warnings,
		} satisfies DatabaseSchemaIR;
	},
};
