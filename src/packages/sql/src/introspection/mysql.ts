import type {
	ColumnIR,
	DatabaseSchemaIR,
	ForeignKeyIR,
	IntrospectOptions,
	IntrospectionQuery,
	SchemaIntrospector,
	TableIR,
} from './schema-ir';
import { applyTableFilter } from './schema-ir';

const TABLES = `
	SELECT TABLE_NAME AS table_name,
	       CASE TABLE_TYPE WHEN 'BASE TABLE' THEN 'table' ELSE 'view' END AS kind
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
	ORDER BY TABLE_NAME`;

const COLUMNS = `
	SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, ORDINAL_POSITION AS ordinal,
	       DATA_TYPE AS data_type, COLUMN_TYPE AS full_type,
	       IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS default_value,
	       CHARACTER_MAXIMUM_LENGTH AS char_length,
	       NUMERIC_PRECISION AS numeric_precision, NUMERIC_SCALE AS numeric_scale,
	       EXTRA AS extra, GENERATION_EXPRESSION AS generation_expression
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	ORDER BY TABLE_NAME, ORDINAL_POSITION`;

const CONSTRAINTS = `
	SELECT tc.TABLE_NAME AS table_name, tc.CONSTRAINT_NAME AS constraint_name,
	       tc.CONSTRAINT_TYPE AS constraint_type,
	       kcu.COLUMN_NAME AS column_name, kcu.ORDINAL_POSITION AS ordinal,
	       kcu.REFERENCED_TABLE_NAME AS ref_table, kcu.REFERENCED_COLUMN_NAME AS ref_column,
	       rc.UPDATE_RULE AS on_update, rc.DELETE_RULE AS on_delete
	FROM information_schema.TABLE_CONSTRAINTS tc
	JOIN information_schema.KEY_COLUMN_USAGE kcu
	  ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
	 AND kcu.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
	 AND kcu.TABLE_NAME        = tc.TABLE_NAME
	LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
	  ON rc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
	 AND rc.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
	 AND rc.TABLE_NAME        = tc.TABLE_NAME
	WHERE tc.TABLE_SCHEMA = DATABASE()
	  AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
	ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION`;

/**
 * Parses the members out of an `enum('a','b''c')` column type.
 *
 * A naive split on commas is wrong: MySQL doubles a quote to escape it, so a label can contain both
 * a comma and a quote.
 */
const parseEnumValues = (fullType: string): string[] | undefined => {
	const match = /^enum\((.*)\)$/i.exec(fullType.trim());
	if (!match) return undefined;

	const values: string[] = [];
	let current = '';
	let inString = false;

	for (let index = 0; index < match[1].length; index++) {
		const character = match[1][index];

		if (!inString) {
			if (character === "'") inString = true;
			continue;
		}

		if (character === "'") {
			if (match[1][index + 1] === "'") {
				current += "'";
				index++;
			} else {
				values.push(current);
				current = '';
				inString = false;
			}
			continue;
		}

		current += character;
	}

	return values;
};

export const mysqlIntrospector: SchemaIntrospector = {
	dialect: 'mysql',

	async introspect(query: IntrospectionQuery, options: IntrospectOptions = {}) {
		const warnings: string[] = [];

		const [tableRows, columnRows, constraintRows] = await Promise.all([
			query(TABLES),
			query(COLUMNS),
			query(CONSTRAINTS),
		]);

		const tables = new Map<string, TableIR>();

		for (const row of tableRows) {
			if (!options.includeViews && row.kind !== 'table') continue;

			tables.set(String(row.table_name), {
				name: String(row.table_name),
				kind: row.kind === 'table' ? 'table' : 'view',
				columns: [],
				foreignKeys: [],
				uniques: [],
			});
		}

		for (const row of columnRows) {
			const table = tables.get(String(row.table_name));
			if (!table) continue;

			const fullType = String(row.full_type);
			const extra = String(row.extra ?? '');

			table.columns.push({
				name: String(row.column_name),
				ordinal: Number(row.ordinal),
				dataType: String(row.data_type),
				fullType,
				length: row.char_length === null ? undefined : Number(row.char_length),
				precision: row.numeric_precision === null ? undefined : Number(row.numeric_precision),
				scale: row.numeric_scale === null ? undefined : Number(row.numeric_scale),
				unsigned: / unsigned/i.test(fullType),
				nullable: String(row.is_nullable).toUpperCase() === 'YES',
				defaultValue: row.default_value === null ? undefined : String(row.default_value),
				defaultIsExpression: /DEFAULT_GENERATED/i.test(extra),
				autoIncrement: /auto_increment/i.test(extra),
				generated: /STORED GENERATED/i.test(extra)
					? 'stored'
					: /VIRTUAL GENERATED/i.test(extra)
						? 'virtual'
						: undefined,
				enumValues: parseEnumValues(fullType),
			} satisfies ColumnIR);
		}

		// Group first, then order by the ordinal we selected, rather than trusting row order.
		const grouped = new Map<string, Record<string, unknown>[]>();
		for (const row of constraintRows) {
			const id = `${String(row.table_name)}.${String(row.constraint_name)}`;
			grouped.set(id, [...(grouped.get(id) ?? []), row]);
		}

		for (const rows of grouped.values()) {
			const ordered = [...rows].sort((left, right) => Number(left.ordinal) - Number(right.ordinal));
			const [first] = ordered;
			const table = tables.get(String(first.table_name));
			if (!table) continue;

			const name = String(first.constraint_name);
			const columns = ordered.map((row) => String(row.column_name));

			if (first.constraint_type === 'PRIMARY KEY') {
				table.primaryKey = { name, columns };
			} else if (first.constraint_type === 'UNIQUE') {
				table.uniques.push({ name, columns });
			} else if (first.ref_table) {
				table.foreignKeys.push({
					name,
					columns,
					referencedTable: String(first.ref_table),
					referencedColumns: ordered.map((row) => String(row.ref_column)),
					onDelete: String(first.on_delete ?? ''),
					onUpdate: String(first.on_update ?? ''),
				} satisfies ForeignKeyIR);
			}
		}

		for (const table of tables.values()) {
			table.foreignKeys.sort((left, right) => left.name.localeCompare(right.name));
		}

		return {
			dialect: 'mysql',
			tables: applyTableFilter([...tables.values()], options),
			enums: [],
			warnings,
		} satisfies DatabaseSchemaIR;
	},
};
