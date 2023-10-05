import { DocumentNode, gql } from '@apollo/client';

export const VERIFY_REGISTRATION_OPTIONS: DocumentNode = gql`
	mutation passkeyVerifyRegistrationResponse($registrationResponse: PasskeyRegistrationResponse!) {
		passkeyVerifyRegistrationResponse(registrationResponse: $registrationResponse)
	}
`;

export const GENERATE_REGISTRATION_OPTIONS: DocumentNode = gql`
	mutation {
		passkeyGenerateRegistrationOptions
	}
`;
