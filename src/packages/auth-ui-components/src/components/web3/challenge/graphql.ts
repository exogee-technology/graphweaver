import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_WEB3_MUTATION: DocumentNode = gql`
	mutation verifyWeb3Challenge($token: String!) {
		result: verifyWeb3Challenge(token: $token) {
			authToken
		}
	}
`;

export const ENROL_WALLET_MUTATION: DocumentNode = gql`
	mutation enrolWallet($token: String!) {
		result: enrolWallet(token: $token)
	}
`;
