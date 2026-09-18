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

/**
 * SQLite has no information_schema, so this is `sqlite_master` plus a handful of PRAGMAs per table.
 * That is N+1 queries, which is fine against a local file and is what every other tool does too.
 */
export const sqliteIntrospector: SchemaIntrospector = {
	dialect: 'sqlite',

	async introspect(query: IntrospectionQuery, options: IntrospectOptions = {}) {
		const warnings: string[] = [];
		const kinds = options.includeViews ? `('table','view')` : `('table')`;

		const tableRows = await query(
			`SELECT name, type, sql FROM sqlite_master
			 WHERE type IN ${kinds} AND name NOT LIKE 'sqlite_%' ORDER BY name`
		);

		const tables: TableIR[] = [];

		for (const tableRow of tableRows) {
			const name = String(tableRow.name);
			// Needed for AUTOINCREMENT, which no pragma reports.
			const createSql = String(tableRow.sql ?? '');

			const columnRows = await query(`PRAGMA table_xinfo("${name.replace(/"/g, '""')}")`);
			const foreignKeyRows = await query(`PRAGMA foreign_key_list("${name.replace(/"/g, '""')}")`);
			const indexRows = await query(`PRAGMA index_list("${name.replace(/"/g, '""')}")`);

			const columns: ColumnIR[] = [];
			const primaryKeyColumns: { column: string; position: number }[] = [];

			for (const row of columnRows) {
				// `hidden` 2 and 3 are generated columns; 1 is a virtual table's hidden column.
				const hidden = Number(row.hidden ?? 0);
				const declared = String(row.type ?? '');
				const columnName = String(row.name);

				// `pk` is the 1-based position in the primary key, not a boolean.
				const pkPosition = Number(row.pk ?? 0);
				if (pkPosition > 0) primaryKeyColumns.push({ column: columnName, position: pkPosition });

				columns.push({
					name: columnName,
					ordinal: Number(row.cid ?? 0) + 1,
					dataType: declared,
					fullType: declared,
					nullable: Number(row.notnull ?? 0) === 0 && pkPosition === 0,
					defaultValue: row.dflt_value === null ? undefined : String(row.dflt_value),
					defaultIsExpression:
						row.dflt_value !== null && /\w\s*\(/.test(String(row.dflt_value ?? '')),
					// A single-column INTEGER PRIMARY KEY is an alias for rowid, so it is generated
					// whether or not AUTOINCREMENT was spelled out.
					autoIncrement:
						(pkPosition === 1 &&
							declared.trim().toUpperCase() === 'INTEGER' &&
							columnRows.filter((entry) => Number(entry.pk ?? 0) > 0).length === 1) ||
						/AUTOINCREMENT/i.test(createSql),
					generated: hidden === 3 ? 'stored' : hidden === 2 ? 'virtual' : undefined,
				});
			}

			const foreignKeysById = new Map<number, Record<string, unknown>[]>();
			for (const row of foreignKeyRows) {
				const id = Number(row.id);
				foreignKeysById.set(id, [...(foreignKeysById.get(id) ?? []), row]);
			}

			const foreignKeys: ForeignKeyIR[] = [...foreignKeysById.entries()]
				.sort(([left], [right]) => left - right)
				.map(([id, rows]) => {
					const ordered = [...rows].sort((left, right) => Number(left.seq) - Number(right.seq));
					const referencedTable = String(ordered[0].table);

					return {
						name: `fk_${name}_${id}`,
						columns: ordered.map((row) => String(row.from)),
						referencedTable,
						// `to` is null when the key targets the referenced table's primary key
						// implicitly, so fall back to whatever that table's key turns out to be.
						referencedColumns: ordered.map((row) => (row.to === null ? '' : String(row.to))),
						onDelete: String(ordered[0].on_delete ?? ''),
						onUpdate: String(ordered[0].on_update ?? ''),
					} satisfies ForeignKeyIR;
				});

			const uniques: TableIR['uniques'] = [];
			for (const row of indexRows) {
				if (row.origin !== 'u') continue;

				const indexName = String(row.name);
				const infoRows = await query(`PRAGMA index_info("${indexName.replace(/"/g, '""')}")`);

				uniques.push({
					name: indexName,
					columns: [...infoRows]
						.sort((left, right) => Number(left.seqno) - Number(right.seqno))
						.map((entry) => String(entry.name)),
				});
			}

			tables.push({
				name,
				kind: tableRow.type === 'view' ? 'view' : 'table',
				columns,
				primaryKey: primaryKeyColumns.length
					? {
							columns: primaryKeyColumns
								.sort((left, right) => left.position - right.position)
								.map((entry) => entry.column),
						}
					: undefined,
				foreignKeys,
				uniques,
			});
		}

		// Resolve the implicit foreign key targets now that every primary key is known.
		for (const table of tables) {
			for (const foreignKey of table.foreignKeys) {
				const target = tables.find((entry) => entry.name === foreignKey.referencedTable);
				if (!target?.primaryKey) continue;

				foreignKey.referencedColumns = foreignKey.referencedColumns.map(
					(column, index) => column || target.primaryKey!.columns[index] || column
				);
			}
		}

		return {
			dialect: 'sqlite',
			tables: applyTableFilter(tables, options),
			enums: [],
			warnings,
		} satisfies DatabaseSchemaIR;
	},
};
