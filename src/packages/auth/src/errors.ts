import { ApolloError } from 'apollo-server-errors';
import { graphweaverMetadata } from '@exogee/graphweaver';

import { AuthenticationMethod } from './types';
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
	NESTED_FILTER = 'NESTED_FILTER',
	INPUT = 'INPUT',
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
			case FieldLocation.NESTED_FILTER:
				this.formatFilterMessage();
				break;
			case FieldLocation.FILTER:
				this.formatArgMessage();
				break;
			case FieldLocation.INPUT:
				this.formatArgMessage();
				break;
		}
	}

	private setExtensions(code: RestrictedFieldErrorCode) {
		this.extensions = {
			...this.extensions,
			code,
			isRestrictedFieldError: true,
		};
	}

	private formatFieldMessage() {
		this.message = `Cannot query field "${this.field.name}" on type "${this.entityName}". [Suggestion hidden]?`;
		this.setExtensions(RestrictedFieldErrorCode.GRAPHQL_VALIDATION_FAILED);
	}

	private formatFilterMessage() {
		const entity = graphweaverMetadata.getEntityByName(this.entityName);
		this.message = `Field "${this.field.name}" is not defined by type "${entity?.plural ?? this.entityName}ListFilter". [Suggestion hidden]?`;
		this.setExtensions(RestrictedFieldErrorCode.GRAPHQL_VALIDATION_FAILED);
	}

	private formatArgMessage() {
		this.message = `Field "${this.field.name}" is not defined by type "${this.entityName}". [Suggestion hidden]?`;
		this.setExtensions(RestrictedFieldErrorCode.BAD_USER_INPUT);
	}
}
