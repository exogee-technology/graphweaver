import { DocumentNode, gql } from '@apollo/client';

export const SEND_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation {
		sendChallengeMagicLink
	}
`;

export const VERIFY_MAGIC_LINK_MUTATION: DocumentNode = gql`
	mutation verifyChallengeMagicLink($token: String!) {
		result: verifyChallengeMagicLink(token: $token) {
			authToken
		}
	}
`;
