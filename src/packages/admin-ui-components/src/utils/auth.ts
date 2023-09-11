import { ApolloError } from '@apollo/client/errors';

export const didEncounterChallenge = (err: ApolloError): boolean => {
	const didEncounterChallengeErrors = err.graphQLErrors?.some(
		(error: any) => error.extensions.code === 'CHALLENGE'
	);
	console.log(err.graphQLErrors?.[0]?.extensions);

	return didEncounterChallengeErrors;
};
