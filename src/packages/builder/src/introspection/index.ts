import { introspection as databaseIntrospection } from '@exogee/graphweaver-mikroorm';
import { introspection as restIntrospection } from '@exogee/graphweaver-rest';

import { DatabaseOptions } from '../auth';

export const startIntrospection = async (databaseOptions: DatabaseOptions) => {
	if (!databaseOptions.source) {
		throw new Error('No source specified, please specify a data source.');
	}

	if (databaseOptions.source === 'rest') {
		if (!databaseOptions.database) {
			throw new Error('No Open API file path for REST data source.');
		}

		return restIntrospection({ openAPIFilePathOrUrl: databaseOptions.database });
	} else {
		return databaseIntrospection(databaseOptions.source, {
			mikroOrmConfig: {
				host: databaseOptions.host,
				dbName: databaseOptions.database,
				user: databaseOptions.user,
				password: databaseOptions.password,
				port: databaseOptions.port,
			},
		});
	}
};
