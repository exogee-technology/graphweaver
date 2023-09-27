import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_WEB3_MUTATION: DocumentNode = gql`
	mutation verifyWeb3Challenge($signature: String!, $message: String!) {
		result: verifyWeb3Challenge(signature: $signature, message: $message) {
			authToken
		}
	}
`;

export const REGISTER_WALLET_ADDRESS_MUTATION: DocumentNode = gql`
	mutation registerWalletAddress($address: String!) {
		result: registerWalletAddress(address: $address)
	}
`;
