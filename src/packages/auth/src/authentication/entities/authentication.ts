export interface AuthenticationBaseEntity<T> {
	id: string;
	type: string;
	userId: string;
	data: T;
	createdAt: Date;
}
