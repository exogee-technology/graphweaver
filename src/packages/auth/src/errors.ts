import { ApolloError } from 'apollo-server-errors';
import { AuthenticationClassReference, MultiFactorAuthentication } from './types';
export { ForbiddenError } from 'apollo-server-errors';

export enum ErrorCodes {
	CHALLENGE = 'CHALLENGE',
	FORBIDDEN = 'FORBIDDEN',
}

export class ChallengeError extends ApolloError {
	constructor(
		message: string,
		extensions: {
			entity: string;
			provider: MultiFactorAuthentication;
			acr: AuthenticationClassReference;
		}
	) {
		super(message, 'CHALLENGE', extensions);

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}
