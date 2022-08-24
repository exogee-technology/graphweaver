import { AccessControlList, AclMap } from '..';

export function AuthorizeAccess(acl: AccessControlList<any>) {
	return function (constructor: any): void {
		if (AclMap.get(constructor.name)) {
			throw new Error(`An ACL already exists for ${constructor.name}`);
		}
		AclMap.set(constructor.name, acl);
	};
}