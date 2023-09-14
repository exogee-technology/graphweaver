import { DocumentNode, gql } from '@apollo/client';

export const LOGIN_MUTATION: DocumentNode = gql`
	mutation loginPassword($username: String!, $password: String!) {
		loginPassword(username: $username, password: $password) {
			authToken
		}
	}
`;
