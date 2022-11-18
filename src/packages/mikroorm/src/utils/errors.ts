import { ApolloError } from 'apollo-server-core';

export class OptimisticLockError<T> extends ApolloError {
	constructor(message: string, extensions: { entity: T }) {
		super(message, 'OPTIMISTIC_LOCK_ERROR', extensions);
	}
}
