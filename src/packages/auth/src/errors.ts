import { ApolloError } from 'apollo-server-errors';
import { AuthenticationMethod } from './types';

export { ForbiddenError } from 'apollo-server-errors';

export enum ErrorCodes {
	CHALLENGE = 'CHALLENGE',
	FORBIDDEN = 'FORBIDDEN',
	RESTRICTED_FIELD = 'GRAPHQL_VALIDATION_FAILED',
}

export class ChallengeError extends ApolloError {
	constructor(
		message: string,
		public extensions: {
			code?: ErrorCodes.CHALLENGE;
			providers: AuthenticationMethod[];
		}
	) {
		super(message, ErrorCodes.CHALLENGE, extensions);
		this.code = ErrorCodes.CHALLENGE;
		this.extensions = { ...this.extensions, code: this.code };

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}

export class RestrictedFieldError extends ApolloError {
	constructor(message: string) {
		super(message, ErrorCodes.RESTRICTED_FIELD);
		this.code = ErrorCodes.RESTRICTED_FIELD;
		this.extensions = { ...this.extensions, code: this.code };

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}
