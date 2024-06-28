import { version } from '../../package.json';
import { peerDependencies as mikroPackagePeerDependencies } from '../../../mikroorm/package.json';

export const GRAPHWEAVER_TARGET_VERSION = version;
export const MIKRO_ORM_TARGET_VERSION = mikroPackagePeerDependencies['@mikro-orm/core'];

export const graphweaverVersion = (versionOverride?: string, packageName?: string) => {
	if (versionOverride === 'local' && packageName) {
		return `file:../local_modules/${packageName}`;
	}
	return versionOverride ? versionOverride : GRAPHWEAVER_TARGET_VERSION;
};
