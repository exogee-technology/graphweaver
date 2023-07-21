import { Backend } from '.';
import { GRAPHWEAVER_TARGET_VERSION, MIKRO_ORM_TARGET_VERSION } from './constants';

export const packagesForBackend = (backend: Backend, version?: string): Record<string, string> => {
	const graphweaverVersion = version ?? GRAPHWEAVER_TARGET_VERSION;

	switch (backend) {
		case Backend.MikroOrmPostgres:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/postgresql': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.MikroOrmMysql:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/mysql': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.MikroOrmSqlite:
			return {
				'@exogee/graphweaver-mikroorm': graphweaverVersion,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/sqlite': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.REST:
			return {
				'@exogee/graphweaver-rest': graphweaverVersion,
			};
	}
};
