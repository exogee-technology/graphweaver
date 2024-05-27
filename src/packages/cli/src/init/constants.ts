import { version } from '../../package.json';

export const GRAPHWEAVER_TARGET_VERSION = version;
export const MIKRO_ORM_TARGET_VERSION = '6.2.8';
export const AWS_LAMBDA_VERSION = '2.0.1';

export const graphweaverVersion = (versionOverride?: string, packageName?: string) => {
	if (versionOverride === 'local' && packageName) {
		return `file:../local_modules/${packageName}`;
	}
	return versionOverride ? versionOverride : GRAPHWEAVER_TARGET_VERSION;
};
