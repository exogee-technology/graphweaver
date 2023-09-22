import { ApolloError } from 'apollo-server-errors';
import { AuthenticationMethod } from './types';

export { ForbiddenError } from 'apollo-server-errors';

export enum ErrorCodes {
	CHALLENGE = 'CHALLENGE',
	FORBIDDEN = 'FORBIDDEN',
}

export class ChallengeError extends ApolloError {
	constructor(
		message: string,
		public extensions: {
			code?: ErrorCodes.CHALLENGE;
			entity: string;
			providers: AuthenticationMethod[];
		}
	) {
		super(message, ErrorCodes.CHALLENGE, extensions);
		this.code = ErrorCodes.CHALLENGE;
		this.extensions = { ...this.extensions, code: this.code };

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}
