import { version, devDependencies } from '../../package.json';
import { devDependencies as mikroPackageDevDependencies } from '../../../mikroorm/package.json';
import { dependencies as graphweaverServerDependencies } from '../../../server/package.json';

export const AS_INTEGRATIONS_AWS_LAMBDA_TARGET_VERSION =
	graphweaverServerDependencies['@as-integrations/aws-lambda'];
export const GRAPHQL_TARGET_VERSION = graphweaverServerDependencies.graphql;
export const GRAPHWEAVER_TARGET_VERSION = version;
export const MIKRO_ORM_TARGET_VERSION = mikroPackageDevDependencies['@mikro-orm/core'];
export const NODE_TYPES_TARGET_VERSION = devDependencies['@types/node'];
export const TYPESCRIPT_TARGET_VERSION = devDependencies.typescript;

export const graphweaverVersion = (versionOverride?: string, packageName?: string) => {
	if (versionOverride === 'local' && packageName) {
		return `file:../local_modules/${packageName}`;
	}
	return versionOverride ? versionOverride : GRAPHWEAVER_TARGET_VERSION;
};
