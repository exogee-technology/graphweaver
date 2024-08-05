import { ApolloError } from 'apollo-server-errors';
import { AuthenticationMethod } from './types';
import { graphweaverMetadata } from '@exogee/graphweaver';
import { FieldDetails } from './auth-utils';

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
			providers: AuthenticationMethod[];
		}
	) {
		super(message, ErrorCodes.CHALLENGE, extensions);
		this.code = ErrorCodes.CHALLENGE;
		this.extensions = { ...this.extensions, code: this.code };

		Object.defineProperty(this, 'name', { value: 'ChallengeError' });
	}
}

enum RestrictedFieldErrorCode {
	GRAPHQL_VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED',
	BAD_USER_INPUT = 'BAD_USER_INPUT',
}

export enum FieldLocation {
	FIELD = 'FIELD',
	FILTER = 'FILTER',
}

export class RestrictedFieldError extends ApolloError {
	constructor(
		private entityName: string,
		private field: FieldDetails
	) {
		super('');

		switch (this.field.location) {
			case FieldLocation.FIELD:
				this.formatFieldMessage();
				break;
			case FieldLocation.FILTER:
				this.formatFilterArgMessage();
				break;
		}
	}

	private formatFieldMessage() {
		this.message = `Cannot query field "${this.field.name}" on type "${this.entityName}". [Suggestion hidden]?`;
		this.extensions = {
			...this.extensions,
			code: RestrictedFieldErrorCode.GRAPHQL_VALIDATION_FAILED,
			isRestrictedFieldError: true,
		};
	}

	private formatFilterArgMessage() {
		const entity = graphweaverMetadata.getEntityByName(this.entityName);
		this.message = `Variable "$filter" got invalid value { ${this.field.name}: "${this.field.value}" }; Field "${this.field.name}" is not defined by type "${entity?.plural}ListFilter". [Suggestion hidden]?`;
		this.extensions = {
			...this.extensions,
			code: RestrictedFieldErrorCode.BAD_USER_INPUT,
			isRestrictedFieldError: true,
		};
	}
}
