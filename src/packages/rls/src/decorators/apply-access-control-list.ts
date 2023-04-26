import { AccessControlList, AclMap, AuthorizationContext } from '..';

export function ApplyAccessControlList<G, TContext extends AuthorizationContext>(
	acl: Partial<AccessControlList<G, TContext>>
) {
	return function (constructor: any): void {
		if (AclMap.get(constructor.name)) {
			throw new Error(`An ACL already exists for ${constructor.name}`);
		}
		AclMap.set(constructor.name, acl);
	};
}
