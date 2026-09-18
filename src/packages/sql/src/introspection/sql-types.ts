import type { DialectName } from '../dialect/dialect';
import type { ColumnType } from '../ir/nodes';
import type { ColumnIR } from './schema-ir';

/**
 * Maps a dialect's own type name onto the small vocabulary the rest of the package uses.
 *
 * `bigint` and `decimal` are the two that matter most: both lose data if they become JS numbers,
 * and every driver gets at least one of them wrong by default.
 */
const POSTGRES: Record<string, ColumnType> = {
	bool: 'boolean',
	int2: 'int',
	int4: 'int',
	int8: 'bigint',
	float4: 'float',
	float8: 'float',
	numeric: 'decimal',
	money: 'decimal',
	varchar: 'string',
	bpchar: 'string',
	char: 'string',
	name: 'string',
	citext: 'string',
	text: 'text',
	xml: 'text',
	uuid: 'uuid',
	json: 'json',
	jsonb: 'json',
	date: 'date',
	time: 'time',
	timetz: 'time',
	interval: 'time',
	timestamp: 'datetime',
	timestamptz: 'datetime',
	bytea: 'binary',
};

const MYSQL: Record<string, ColumnType> = {
	tinyint: 'int',
	smallint: 'int',
	mediumint: 'int',
	int: 'int',
	integer: 'int',
	year: 'int',
	bigint: 'bigint',
	float: 'float',
	double: 'float',
	decimal: 'decimal',
	numeric: 'decimal',
	char: 'string',
	varchar: 'string',
	tinytext: 'text',
	text: 'text',
	mediumtext: 'text',
	longtext: 'text',
	json: 'json',
	date: 'date',
	time: 'time',
	datetime: 'datetime',
	timestamp: 'datetime',
	binary: 'binary',
	varbinary: 'binary',
	tinyblob: 'binary',
	blob: 'binary',
	mediumblob: 'binary',
	longblob: 'binary',
	bit: 'binary',
	enum: 'string',
};

const MSSQL: Record<string, ColumnType> = {
	bit: 'boolean',
	tinyint: 'int',
	smallint: 'int',
	int: 'int',
	bigint: 'bigint',
	real: 'float',
	float: 'float',
	decimal: 'decimal',
	numeric: 'decimal',
	money: 'decimal',
	smallmoney: 'decimal',
	char: 'string',
	varchar: 'string',
	nchar: 'string',
	nvarchar: 'string',
	text: 'text',
	ntext: 'text',
	xml: 'text',
	uniqueidentifier: 'uuid',
	date: 'date',
	time: 'time',
	datetime: 'datetime',
	datetime2: 'datetime',
	smalldatetime: 'datetime',
	datetimeoffset: 'datetime',
	binary: 'binary',
	varbinary: 'binary',
	image: 'binary',
	timestamp: 'binary',
	rowversion: 'binary',
};

/**
 * SQLite has no column types, only affinities, so the declared text is a hint. These are SQLite's
 * own rules, applied in order.
 */
const sqliteAffinity = (declared: string): ColumnType => {
	const type = declared.toUpperCase();

	if (type.includes('INT')) return type.includes('BIGINT') ? 'bigint' : 'int';
	if (type.includes('CHAR') || type.includes('CLOB') || type.includes('TEXT')) {
		// Common spellings people use even though SQLite stores them as text.
		if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return 'datetime';
		if (type.includes('DATE')) return 'date';
		return 'string';
	}
	if (type.includes('BLOB') || type === '') return 'binary';
	if (type.includes('REAL') || type.includes('FLOA') || type.includes('DOUB')) return 'float';
	if (type.includes('DECIMAL') || type.includes('NUMERIC')) return 'decimal';
	if (type.includes('BOOL')) return 'boolean';

	return 'float';
};

const TABLES: Record<Exclude<DialectName, 'sqlite'>, Record<string, ColumnType>> = {
	postgres: POSTGRES,
	mysql: MYSQL,
	mssql: MSSQL,
};

export const columnTypeForSqlType = (dialect: DialectName, column: ColumnIR): ColumnType => {
	if (dialect === 'sqlite') {
		// An INTEGER PRIMARY KEY is an alias for rowid, so it is always an int.
		return sqliteAffinity(column.dataType);
	}

	// MySQL spells a boolean TINYINT(1), which is indistinguishable from a small int by name alone.
	if (dialect === 'mysql' && /^tinyint\(1\)/i.test(column.fullType)) return 'boolean';

	// An enum column is stored as whatever its labels are, which is text in every case we emit.
	if (column.enumValues?.length) return 'string';

	return TABLES[dialect][column.dataType] ?? 'unknown';
};
