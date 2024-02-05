import { DocumentNode, gql } from '@apollo/client';

// START HERE: handle the password reset and token in a mutation
export const RESET_PASSWORD: DocumentNode = gql`
	mutation resetPassword($password: String!, $token: String!) {
		result: resetPassword(password: $password, token: $token)
	}
`;
