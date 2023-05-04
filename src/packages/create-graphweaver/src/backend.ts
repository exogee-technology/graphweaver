import { GRAPHWEAVER_TARGET_VERSION, MIKRO_ORM_TARGET_VERSION } from './constants';

export enum Backend {
	MikroOrmPostgres,
	MikroOrmMysql,
	REST,
}

export const packagesForBackend = (backend: Backend): Record<string, string> => {
	switch (backend) {
		case Backend.MikroOrmPostgres:
			return {
				'@exogee/graphweaver-mikroorm': GRAPHWEAVER_TARGET_VERSION,
				'@exogee/graphweaver-apollo': GRAPHWEAVER_TARGET_VERSION,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/postgresql': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.MikroOrmMysql:
			return {
				'@exogee/graphweaver-mikroorm': GRAPHWEAVER_TARGET_VERSION,
				'@exogee/graphweaver-apollo': GRAPHWEAVER_TARGET_VERSION,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/mysql': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.REST:
			return {
				'@exogee/graphweaver-rest': GRAPHWEAVER_TARGET_VERSION,
			};
	}
};
