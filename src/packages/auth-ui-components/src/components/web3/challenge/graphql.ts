import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_WEB3_MUTATION: DocumentNode = gql`
	mutation verifyWeb3ChallengeMagicLink($signedMessage: String!) {
		result: verifyWeb3ChallengeMagicLink(signedMessage: $signedMessage) {
			authToken
		}
	}
`;
