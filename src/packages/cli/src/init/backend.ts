import { Backend } from '.';
import { MIKRO_ORM_TARGET_VERSION, graphweaverVersion } from './constants';

export const packagesForBackend = (backend: Backend, version?: string): Record<string, string> => {
	switch (backend) {
		case Backend.Postgres:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion(version, '@exogee/graphweaver-mikroorm'),
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/knex': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/postgresql': MIKRO_ORM_TARGET_VERSION,
				pg: '8.12.0',
			};

		case Backend.Mysql:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion(version, '@exogee/graphweaver-mikroorm'),
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/knex': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/mysql': MIKRO_ORM_TARGET_VERSION,
				mysql2: '3.10.3',
			};

		case Backend.Mssql:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion(version, '@exogee/graphweaver-mikroorm'),
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/knex': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/mssql': MIKRO_ORM_TARGET_VERSION,
				tedious: '18.6.1',
			};

		case Backend.Sqlite:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion(version, '@exogee/graphweaver-mikroorm'),
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/knex': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/sqlite': MIKRO_ORM_TARGET_VERSION,
				'mikro-orm-sqlite-wasm': graphweaverVersion(version, 'mikro-orm-sqlite-wasm'),
			};

		case Backend.Rest:
			return {
				'@exogee/graphweaver-rest': graphweaverVersion(version, '@exogee/graphweaver-rest'),
			};
	}
};
