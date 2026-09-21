import { defineConnection } from '@exogee/graphweaver-sql';
import { sqlite } from '@exogee/graphweaver-sql-sqlite';

export const connection = defineConnection({
	id: 'sqlite',
	dialect: sqlite({ filename: 'databases/database.sqlite' }),
});

export const traceConnection = defineConnection({
	id: 'sqlite2',
	dialect: sqlite({ filename: 'databases/trace.sqlite' }),
});
