import { ApolloError, UserInputError as ApolloUserInputError } from '@exogee/graphweaver-apollo';

export {
	AuthenticationError,
	ApolloError as InternalServerError,
} from '@exogee/graphweaver-apollo';

export class UserInputError extends ApolloUserInputError {
	constructor(message: string, extensions: { friendlyMessage: string }) {
		super(message, extensions);
	}
}

export class ExternalSystemError extends ApolloError {
	constructor(message: string) {
		super(message, 'EXTERNAL_SYSTEM_ERROR');
	}
}

export class OperationNotPermittedError extends ApolloError {
	constructor(message: string) {
		super(message, 'OperationNotPermitted');
	}
}

export class BusinessRuleViolationError extends ApolloError {
	constructor(message: string, extensions: { friendlyMessage: string }) {
		super(message, 'BUSINESS_RULE_VIOLATION', extensions);
	}
}
