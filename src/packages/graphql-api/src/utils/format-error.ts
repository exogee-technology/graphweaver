import { GraphQLError } from 'graphql';

export const formatGraphQLError = (error: GraphQLError) => {
	// We can strip the bodies out of the message, they're huge and unnecessary
	error.message = error.message.replace(/body=\{.+?\},/, '');
	error.message = error.message.replace(/requestBody=\{.+?\},/, '');

	// Also don't want the stack going to clients
	if (process.env.IS_OFFLINE !== 'true') {
		// Catch introspection errors in prod
		if (error.message.startsWith('GraphQL introspection is not allowed by Apollo Server')) {
			return new Error('Internal Server Error');
		}
	}

	return error;
};
