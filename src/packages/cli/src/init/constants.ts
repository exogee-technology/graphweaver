import { version } from '../../package.json';

export const GRAPHWEAVER_TARGET_VERSION = version;
export const MIKRO_ORM_TARGET_VERSION = '5.4.2';
export const AWS_LAMBDA_VERSION = '2.0.1';

export const graphweaverVersion = (versionOverride?: string, packageName?: string) => {
	if (versionOverride === 'local' && packageName) {
		return `link:../../${packageName}`;
	}
	return versionOverride ? versionOverride : GRAPHWEAVER_TARGET_VERSION;
};
