import { ApolloError } from 'apollo-server-errors';
export { ForbiddenError } from 'apollo-server-errors';

export enum ErrorCodes {
	CHALLENGE = 'CHALLENGE',
	FORBIDDEN = 'FORBIDDEN',
}

export class ChallengeError extends ApolloError {
	constructor(message: string, extensions: { entity: string; provider: string }) {
		super(message, 'CHALLENGE', extensions);

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}
