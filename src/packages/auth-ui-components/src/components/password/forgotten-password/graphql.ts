import { DocumentNode, gql } from '@apollo/client';

export const SEND_FORGOTTEN_PASSWORD_LINK: DocumentNode = gql`
	mutation sendResetPasswordLink($username: String!) {
		result: sendResetPasswordLink(username: $username)
	}
`;
