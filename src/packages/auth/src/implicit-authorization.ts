import { graphweaverMetadata } from '@exogee/graphweaver';
import { registerAccessControlListHook } from './decorators';
import { AclMap } from './helper-functions';

let implicitAllow = false;

export const setImplicitAllow = (value: true) => {
	implicitAllow = value;
};

export const getImplicitAllow = () => {
	return implicitAllow;
};

export const applyImplicitAllow = () => {
	for (const key of graphweaverMetadata.entityNames()) {
		if (!AclMap.has(key)) {
			// Allow access to all operations
			registerAccessControlListHook(key, {
				Everyone: {
					all: true,
				},
			});
		}
	}
};

export const applyImplicitDeny = () => {
	for (const key of graphweaverMetadata.entityNames()) {
		if (!AclMap.has(key)) {
			// An empty ACL means we deny access to all operations
			registerAccessControlListHook(key, {});
		}
	}
};
