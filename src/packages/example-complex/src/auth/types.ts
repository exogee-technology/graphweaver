export const GENERIC_AUTH_ERROR_MESSAGE = 'Forbidden';

export enum Role {
	SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum Permission {
	NONE = 'NONE',
	READ = 'READ',
	READ_UPDATE_DELETE = 'READ_UPDATE_DELETE',
	READ_WRITE = 'READ_WRITE',
}

export type AccessControlList<T> = { [key in Role]?: AccessFilter<T> };
// @todo Can this be typed better?
export type QueryFilter<T> = any;
export type QueryFilterFunction<T> = () => QueryFilter<T> | Promise<QueryFilter<T>>;
export type AccessFilter<T> = {
	permission: Permission;
	filter?: QueryFilter<T> | QueryFilterFunction<T>;
};

export interface Session {
	token: any;
	expiry: number;
	logout?: boolean;
}

export interface EasyAuthorizationContext {
	session: Session;
	logout?: () => void;
}
