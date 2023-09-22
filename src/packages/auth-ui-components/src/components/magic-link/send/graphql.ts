import { DocumentNode, gql } from '@apollo/client';

export const SEND_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation sendMagicLink($username: String!) {
		sendMagicLink(username: $username)
	}
`;
