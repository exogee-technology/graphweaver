import { GraphQLError } from 'graphql';

export class OptimisticLockError<T> extends GraphQLError {
	constructor(message: string, extensions: { entity: T }) {
		super(message, { extensions: { code: 'OPTIMISTIC_LOCK_ERROR', extensions } });
	}
}
