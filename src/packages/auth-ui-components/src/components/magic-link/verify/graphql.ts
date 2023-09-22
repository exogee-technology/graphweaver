import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation loginMagicLink($username: String!, $token: String!) {
		result: loginMagicLink(username: $username, token: $token) {
			authToken
		}
	}
`;
