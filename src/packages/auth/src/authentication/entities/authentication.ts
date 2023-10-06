export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	data: T;
	createdAt: Date;
}
