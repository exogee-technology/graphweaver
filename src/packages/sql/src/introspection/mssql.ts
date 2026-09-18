import type {
	DatabaseSchemaIR,
	ForeignKeyIR,
	IntrospectOptions,
	IntrospectionQuery,
	SchemaIntrospector,
	TableIR,
} from './schema-ir';
import { applyTableFilter } from './schema-ir';

const TABLES = `
	SELECT s.name AS schema_name, t.name AS table_name, 'table' AS kind
	FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
	WHERE t.is_ms_shipped = 0
	UNION ALL
	SELECT s.name, v.name, 'view'
	FROM sys.views v JOIN sys.schemas s ON s.schema_id = v.schema_id
	WHERE v.is_ms_shipped = 0`;

const COLUMNS = `
	SELECT s.name AS schema_name, t.name AS table_name, c.name AS column_name,
	       c.column_id AS ordinal,
	       ty.name AS type_name, bt.name AS base_type_name,
	       c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity, c.is_computed,
	       dc.definition AS default_value
	FROM sys.columns c
	JOIN sys.tables  t  ON t.object_id  = c.object_id
	JOIN sys.schemas s  ON s.schema_id  = t.schema_id
	JOIN sys.types   ty ON ty.user_type_id = c.user_type_id
	LEFT JOIN sys.types bt
	       ON bt.user_type_id = ty.system_type_id AND bt.user_type_id = bt.system_type_id
	LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
	WHERE t.is_ms_shipped = 0`;

const KEYS = `
	SELECT s.name AS schema_name, t.name AS table_name, i.name AS index_name,
	       i.is_primary_key, i.is_unique_constraint,
	       c.name AS column_name, ic.key_ordinal AS ordinal
	FROM sys.indexes i
	JOIN sys.tables  t ON t.object_id = i.object_id
	JOIN sys.schemas s ON s.schema_id = t.schema_id
	JOIN sys.index_columns ic
	  ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
	JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
	WHERE t.is_ms_shipped = 0 AND (i.is_primary_key = 1 OR i.is_unique_constraint = 1)`;

const FOREIGN_KEYS = `
	SELECT fk.name AS constraint_name,
	       ps.name AS schema_name, pt.name AS table_name, pc.name AS column_name,
	       rs.name AS ref_schema,  rt.name AS ref_table,  rc.name AS ref_column,
	       fkc.constraint_column_id AS ordinal,
	       fk.delete_referential_action_desc AS on_delete,
	       fk.update_referential_action_desc AS on_update
	FROM sys.foreign_keys fk
	JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
	JOIN sys.tables  pt ON pt.object_id = fkc.parent_object_id
	JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
	JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
	JOIN sys.tables  rt ON rt.object_id = fkc.referenced_object_id
	JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
	JOIN sys.columns rc
	  ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id`;

const key = (schema: unknown, table: unknown) => `${String(schema)}.${String(table)}`;

/** `max_length` is in bytes, so the two-byte types report double, and -1 means MAX. */
const lengthFor = (typeName: string, maxLength: number) => {
	if (maxLength === -1) return undefined;
	return /^n(char|varchar)$/i.test(typeName) ? maxLength / 2 : maxLength;
};

/** Default constraint definitions arrive wrapped, sometimes twice: `((0))`, `(N'x')`. */
const unwrapDefault = (definition: string) => {
	let value = definition.trim();
	while (value.startsWith('(') && value.endsWith(')')) value = value.slice(1, -1).trim();
	return value;
};

export const mssqlIntrospector: SchemaIntrospector = {
	dialect: 'mssql',

	async introspect(query: IntrospectionQuery, options: IntrospectOptions = {}) {
		const schemas = options.schemas ?? ['dbo'];
		const warnings: string[] = [];

		const [tableRows, columnRows, keyRows, foreignKeyRows] = await Promise.all([
			query(TABLES),
			query(COLUMNS),
			query(KEYS),
			query(FOREIGN_KEYS),
		]);

		const tables = new Map<string, TableIR>();

		for (const row of tableRows) {
			if (!schemas.includes(String(row.schema_name))) continue;
			if (!options.includeViews && row.kind !== 'table') continue;

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

			// A user-defined alias type resolves back to whatever it was built from.
			const typeName = String(row.base_type_name ?? row.type_name).toLowerCase();
			const maxLength = Number(row.max_length);
			const length = lengthFor(typeName, maxLength);
			const precision = Number(row.precision);
			const scale = Number(row.scale);
			const defaultValue =
				row.default_value === null ? undefined : unwrapDefault(String(row.default_value));

			table.columns.push({
				name: String(row.column_name),
				ordinal: Number(row.ordinal),
				dataType: typeName,
				fullType:
					length !== undefined && /char|binary/i.test(typeName)
						? `${typeName}(${length})`
						: /decimal|numeric/i.test(typeName)
							? `${typeName}(${precision},${scale})`
							: typeName,
				length,
				precision: Number.isFinite(precision) ? precision : undefined,
				scale: Number.isFinite(scale) ? scale : undefined,
				nullable: row.is_nullable === true || row.is_nullable === 1,
				defaultValue,
				defaultIsExpression: Boolean(defaultValue && /\w\s*\(/.test(defaultValue)),
				autoIncrement: row.is_identity === true || row.is_identity === 1,
				generated: row.is_computed === true || row.is_computed === 1 ? 'stored' : undefined,
			});
		}

		const groupedKeys = new Map<string, Record<string, unknown>[]>();
		for (const row of keyRows) {
			const id = `${key(row.schema_name, row.table_name)}.${String(row.index_name)}`;
			groupedKeys.set(id, [...(groupedKeys.get(id) ?? []), row]);
		}

		for (const rows of groupedKeys.values()) {
			const ordered = [...rows].sort((left, right) => Number(left.ordinal) - Number(right.ordinal));
			const [first] = ordered;
			const table = tables.get(key(first.schema_name, first.table_name));
			if (!table) continue;

			const name = String(first.index_name);
			const columns = ordered.map((row) => String(row.column_name));

			if (first.is_primary_key === true || first.is_primary_key === 1) {
				table.primaryKey = { name, columns };
			} else {
				table.uniques.push({ name, columns });
			}
		}

		const groupedForeignKeys = new Map<string, Record<string, unknown>[]>();
		for (const row of foreignKeyRows) {
			const id = `${key(row.schema_name, row.table_name)}.${String(row.constraint_name)}`;
			groupedForeignKeys.set(id, [...(groupedForeignKeys.get(id) ?? []), row]);
		}

		for (const rows of groupedForeignKeys.values()) {
			const ordered = [...rows].sort((left, right) => Number(left.ordinal) - Number(right.ordinal));
			const [first] = ordered;
			const table = tables.get(key(first.schema_name, first.table_name));
			if (!table) continue;

			table.foreignKeys.push({
				name: String(first.constraint_name),
				columns: ordered.map((row) => String(row.column_name)),
				referencedSchema: String(first.ref_schema),
				referencedTable: String(first.ref_table),
				referencedColumns: ordered.map((row) => String(row.ref_column)),
				onDelete: String(first.on_delete ?? ''),
				onUpdate: String(first.on_update ?? ''),
			} satisfies ForeignKeyIR);
		}

		for (const table of tables.values()) {
			table.foreignKeys.sort((left, right) => left.name.localeCompare(right.name));
		}

		return {
			dialect: 'mssql',
			defaultSchema: 'dbo',
			tables: applyTableFilter([...tables.values()], options),
			enums: [],
			warnings,
		} satisfies DatabaseSchemaIR;
	},
};
