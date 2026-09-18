import pluralize from 'pluralize';

export interface NamingStrategy {
	readonly name: string;
	tableName(entityName: string): string;
	columnName(property: string): string;
	/**
	 * The foreign key column for a many-to-one nobody gave an explicit column for.
	 *
	 * Note this is `<property>_id` regardless of what the referenced key is actually called: an
	 * album's artist column is `artist_id`, not `artist_artist_id`, even though Artist's primary
	 * key property is `artistId`. Anything that does not follow that gets an explicit `column:`,
	 * which import codegen emits automatically.
	 */
	foreignKeyColumn(property: string): string;
	/** The pivot table for a many-to-many with no explicit `through`. */
	pivotTableName(ownerTable: string, relatedTable: string): string;
	pivotJoinColumn(table: string, primaryKeyColumn: string): string;
}

/**
 * Deliberately byte-identical to MikroORM's UnderscoreNamingStrategy.
 *
 * Projects that never set `tableName`/`fieldName` on their MikroORM entities have to keep pointing
 * at exactly the same tables and columns after migrating, and that compatibility is worth more than
 * any preference about how names ought to look. It is lossy on acronyms -- XMLHttpRequest becomes
 * xmlhttp_request -- but that never bites on import, because codegen emits an explicit `column:`
 * whenever the strategy would not reproduce the real name.
 */
const underscore = (value: string) =>
	value
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replace(/\W/g, '_')
		.toLowerCase();

export const snakeCase: NamingStrategy = {
	name: 'snakeCase',
	tableName: (entityName) => underscore(entityName),
	columnName: (property) => underscore(property),
	foreignKeyColumn: (property) => `${underscore(property)}_id`,
	pivotTableName: (ownerTable, relatedTable) => [ownerTable, relatedTable].sort().join('_'),
	pivotJoinColumn: (table, primaryKeyColumn) => `${table}_${underscore(primaryKeyColumn)}`,
};

/** For databases whose identifiers are already what you want in code, like Chinook on SQL Server. */
export const preserve: NamingStrategy = {
	name: 'preserve',
	tableName: (entityName) => entityName,
	columnName: (property) => property,
	foreignKeyColumn: (property) => `${property}Id`,
	pivotTableName: (ownerTable, relatedTable) => [ownerTable, relatedTable].sort().join(''),
	pivotJoinColumn: (table, primaryKeyColumn) => `${table}${primaryKeyColumn}`,
};

/**
 * For databases whose identifiers are PascalCase, which Chinook and a lot of SQL Server schemas are.
 *
 * Without this there was no strategy that could reproduce `AlbumId` from the property `albumId`:
 * `preserve` gives `albumId` and `snakeCase` gives `album_id`, so every single field ended up
 * carrying an explicit `column:` override and the generated entities were unreadable.
 */
const pascal = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const pascalCase: NamingStrategy = {
	name: 'pascalCase',
	tableName: (entityName) => pascal(entityName),
	columnName: (property) => pascal(property),
	foreignKeyColumn: (property) => `${pascal(property)}Id`,
	pivotTableName: (ownerTable, relatedTable) => [ownerTable, relatedTable].sort().join(''),
	pivotJoinColumn: (table, primaryKeyColumn) => `${pascal(table)}${pascal(primaryKeyColumn)}`,
};

export const namingStrategies = { snakeCase, preserve, pascalCase } satisfies Record<
	string,
	NamingStrategy
>;

export type NamingStrategyName = keyof typeof namingStrategies;

/**
 * Pluralising a table name is opt in. `pluralize` maps some words to themselves, which would
 * silently give two entities the same table, so that case is reported rather than guessed at.
 */
export const pluralTableName = (strategy: NamingStrategy, entityName: string) => {
	const singular = strategy.tableName(entityName);
	const plural = pluralize.plural(singular);

	if (plural === singular) {
		throw new Error(
			`'${entityName}' pluralises to itself ('${singular}'), so the table name is ambiguous. ` +
				`Give it an explicit table name.`
		);
	}

	return plural;
};
