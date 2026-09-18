export * from './dialect';
export { postgres } from './postgres';
export { mysql } from './mysql';
export { sqlite } from './sqlite';
export { mssql } from './mssql';

import { postgres } from './postgres';
import { mysql } from './mysql';
import { sqlite } from './sqlite';
import { mssql } from './mssql';
import type { Dialect, DialectName } from './dialect';

export const allDialects: Record<DialectName, Dialect> = { postgres, mysql, sqlite, mssql };
