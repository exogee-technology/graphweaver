import { DocumentNode, gql } from '@apollo/client';

export const RESET_PASSWORD: DocumentNode = gql`
	mutation resetPassword($password: String!, $token: String!) {
		result: resetPassword(password: $password, token: $token)
	}
`;
