import { introspection } from '@exogee/graphweaver-mikroorm';

import { DatabaseOptions } from '../auth';

export const startIntrospection = async (databaseOptions: DatabaseOptions) => {
	return introspection(databaseOptions.source, {
		mikroOrmConfig: {
			host: databaseOptions.host,
			dbName: databaseOptions.database,
			user: databaseOptions.user,
			password: databaseOptions.password,
			port: databaseOptions.port,
		},
	});
};
