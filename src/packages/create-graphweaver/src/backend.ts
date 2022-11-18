import { GRAPHWEAVER_TARGET_VERSION } from './constants';

export enum Backend {
	MikroORM,
	REST,
}

export const packagesForBackend = (backend: Backend): Record<string, string> => {
	switch (backend) {
		case Backend.MikroORM:
			return {
				'@exogee/graphweaver-mikroorm': GRAPHWEAVER_TARGET_VERSION,
				'@exogee/graphweaver-apollo': GRAPHWEAVER_TARGET_VERSION,
				'@mikro-orm/core': '5.4.2',
			};

		case Backend.REST:
			return {
				'@exogee/graphweaver-rest': GRAPHWEAVER_TARGET_VERSION,
			};
	}
};
