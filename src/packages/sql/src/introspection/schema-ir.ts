import type { DialectName } from '../dialect/dialect';

/**
 * A database's schema, normalised across the four dialects.
 *
 * This replaces MikroORM's `DatabaseSchema.create()`, which is the single largest thing the ORM was
 * doing for us. Kysely is not an alternative here: its introspector returns tables and columns but
 * no foreign keys, and without those you cannot generate relationships -- which is most of what
 * `graphweaver import` is for.
 */
export interface DatabaseSchemaIR {
	dialect: DialectName;
	defaultSchema?: string;
	tables: TableIR[];
	enums: EnumIR[];
	/** Things we understood well enough to skip but not well enough to model. */
	warnings: string[];
}

export interface TableIR {
	schema?: string;
	name: string;
	kind: 'table' | 'view';
	columns: ColumnIR[];
	primaryKey?: { name?: string; columns: string[] };
	foreignKeys: ForeignKeyIR[];
	uniques: UniqueIR[];
}

export interface ColumnIR {
	name: string;
	ordinal: number;
	/** The dialect's own type name, lowercased and without length: `varchar`, `int8`, `numeric`. */
	dataType: string;
	/** As the database renders it: `varchar(160)`, `numeric(10,2)`. */
	fullType: string;
	length?: number;
	precision?: number;
	scale?: number;
	unsigned?: boolean;
	nullable: boolean;
	defaultValue?: string;
	/** `nextval(...)`, `GETDATE()`, `CURRENT_TIMESTAMP` and friends, rather than a literal. */
	defaultIsExpression: boolean;
	/** serial, identity, AUTO_INCREMENT, or a SQLite rowid alias. */
	autoIncrement: boolean;
	generated?: 'stored' | 'virtual';
	enumValues?: string[];
	enumName?: string;
}

export interface ForeignKeyIR {
	name: string;
	/** Ordered, and parallel to `referencedColumns`. */
	columns: string[];
	referencedSchema?: string;
	referencedTable: string;
	referencedColumns: string[];
	onDelete?: string;
	onUpdate?: string;
}

export interface UniqueIR {
	name: string;
	columns: string[];
}

export interface EnumIR {
	schema?: string;
	name: string;
	values: string[];
}

export interface IntrospectOptions {
	/** Postgres and SQL Server only. Defaults to the dialect's usual one. */
	schemas?: string[];
	includeViews?: boolean;
	/** Restricts the result, after the catalog read. */
	tables?: { include?: string[]; exclude?: string[] };
}

/** Runs a statement and gives back plain rows. Deliberately not tied to any driver. */
export type IntrospectionQuery = (
	sql: string,
	params?: unknown[]
) => Promise<Record<string, unknown>[]>;

export interface SchemaIntrospector {
	readonly dialect: DialectName;
	introspect(query: IntrospectionQuery, options?: IntrospectOptions): Promise<DatabaseSchemaIR>;
}

/** Applies the include/exclude filter. Kept here so every dialect behaves the same way. */
export const applyTableFilter = (tables: TableIR[], options?: IntrospectOptions) => {
	const include = options?.tables?.include;
	const exclude = new Set(options?.tables?.exclude ?? []);

	return tables.filter(
		(table) => (!include || include.includes(table.name)) && !exclude.has(table.name)
	);
};
