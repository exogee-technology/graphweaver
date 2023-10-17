import { DocumentNode, gql } from '@apollo/client';

export const SEND_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation sendLoginMagicLink($username: String!) {
		sendLoginMagicLink(username: $username)
	}
`;

export const VERIFY_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation verifyLoginMagicLink($username: String!, $token: String!) {
		result: verifyLoginMagicLink(username: $username, token: $token) {
			authToken
		}
	}
`;
