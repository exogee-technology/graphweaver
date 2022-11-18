import {
	GRAPHWEAVER_CORE_TARGET_VERSION,
	GRAPHWEAVER_APOLLO_TARGET_VERSION,
	GRAPHWEAVER_REST_TARGET_VERSION,
	GRAPHWEAVER_MIKROORM_TARGET_VERSION,
	MIKRO_ORM_TARGET_VERSION,
} from './constants';

export enum Backend {
	MikroORMPostgres,
	REST,
}

export const packagesForBackend = (backend: Backend): Record<string, string> => {
	switch (backend) {
		case Backend.MikroORMPostgres:
			return {
				'@exogee/graphweaver-mikroorm': GRAPHWEAVER_MIKROORM_TARGET_VERSION,
				'@exogee/graphweaver-apollo': GRAPHWEAVER_APOLLO_TARGET_VERSION,
				'@mikro-orm/core': MIKRO_ORM_TARGET_VERSION,
				'@mikro-orm/postgres': MIKRO_ORM_TARGET_VERSION,
			};

		case Backend.REST:
			return {
				'@exogee/graphweaver-rest': GRAPHWEAVER_REST_TARGET_VERSION,
			};
	}
};
