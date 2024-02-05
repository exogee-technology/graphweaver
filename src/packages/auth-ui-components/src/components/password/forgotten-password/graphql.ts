import { DocumentNode, gql } from '@apollo/client';

export const SEND_FORGOTTEN_PASSWORD_LINK: DocumentNode = gql`
	mutation sendForgottenPasswordLinky($username: String!) {
		result: sendForgottenPasswordLinky(username: $username)
	}
`;
