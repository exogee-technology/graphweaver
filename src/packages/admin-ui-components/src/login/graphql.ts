import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
	mutation loginPassword($username: String!, $password: String!) {
		loginPassword(username: $username, password: $password) {
			authToken
		}
	}
`;

export const CHALLENGE_MUTATION = gql`
	mutation loginPassword($username: String!, $password: String!) {
		loginPassword(username: $username, password: $password) {
			authToken
		}
	}
`;
