import { DocumentNode, gql } from '@apollo/client';

export const CHALLENGE_MUTATION: DocumentNode = gql`
	mutation challengePassword($password: String!) {
		challengePassword(password: $password) {
			authToken
		}
	}
`;
