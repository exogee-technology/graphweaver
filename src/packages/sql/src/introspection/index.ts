export * from './schema-ir';
export * from './sql-types';
export * from './entity-model';
export { postgresIntrospector } from './postgres';
export { mysqlIntrospector } from './mysql';
export { sqliteIntrospector } from './sqlite';
export { mssqlIntrospector } from './mssql';

import type { DialectName } from '../dialect/dialect';
import type { SchemaIntrospector } from './schema-ir';
import { postgresIntrospector } from './postgres';
import { mysqlIntrospector } from './mysql';
import { sqliteIntrospector } from './sqlite';
import { mssqlIntrospector } from './mssql';

export const introspectorFor = (dialect: DialectName): SchemaIntrospector =>
	({
		postgres: postgresIntrospector,
		mysql: mysqlIntrospector,
		sqlite: sqliteIntrospector,
		mssql: mssqlIntrospector,
	})[dialect];
