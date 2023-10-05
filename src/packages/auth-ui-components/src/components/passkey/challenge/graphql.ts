import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_REGISTRATION_RESPONSE: DocumentNode = gql`
	mutation passkeyVerifyRegistrationResponse($registrationResponse: PasskeyRegistrationResponse!) {
		passkeyVerifyRegistrationResponse(registrationResponse: $registrationResponse)
	}
`;

export const GENERATE_REGISTRATION_OPTIONS: DocumentNode = gql`
	mutation {
		passkeyGenerateRegistrationOptions
	}
`;

export const VERIFY_AUTHENTICATION_RESPONSE: DocumentNode = gql`
	mutation passkeyVerifyAuthenticationResponse(
		$authenticationResponse: PasskeyAuthenticationResponse!
	) {
		passkeyVerifyAuthenticationResponse(authenticationResponse: $authenticationResponse) {
			authToken
		}
	}
`;

export const GENERATE_AUTHENTICATION_OPTIONS: DocumentNode = gql`
	mutation {
		passkeyGenerateAuthenticationOptions
	}
`;
