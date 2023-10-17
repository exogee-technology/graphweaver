import { DocumentNode, gql } from '@apollo/client';

export const SEND_OTP_MUTATION: DocumentNode = gql`
	mutation {
		sendOTPChallenge
	}
`;

export const VERIFY_OTP_MUTATION: DocumentNode = gql`
	mutation verifyOTPChallenge($code: String!) {
		result: verifyOTPChallenge(code: $code) {
			authToken
		}
	}
`;
