import { defineConnection } from '@exogee/graphweaver-sql';
import { postgres } from '@exogee/graphweaver-sql-postgres';

export const pgConnection = defineConnection({
	id: 'pg',
	dialect: postgres({
		database: process.env.PGDATABASE,
		port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
	}),
});
