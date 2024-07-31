import gql from 'graphql-tag';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	UserProfile,
	CredentialStorage,
	Password,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (): Promise<UserProfile<unknown>> => user,
});

setAddUserToContext(async () => user);

const graphweaver = new Graphweaver();

describe('AdminUiMetadata - ACL', () => {
	test('should redirect an unauthenticated user to the login screen.', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				{
					_graphweaver {
						entities {
							name
						}
					}
				}
			`,
		});

		expect(response.http.headers.get('X-Auth-Redirect')).toBe(
			`${process.env.AUTH_BASE_URI}/auth/login?redirect_uri=${encodeURIComponent(
				process.env.AUTH_BASE_URI + '/' ?? ''
			)}`
		);
	});
});
