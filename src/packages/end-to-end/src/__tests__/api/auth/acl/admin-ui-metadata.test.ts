import gql from 'graphql-tag';
import Graphweaver, { MetadataHookParams } from '@exogee/graphweaver-server';
import { AdminUiMetadata, BaseDataProvider } from '@exogee/graphweaver';
import {
	UserProfile,
	AuthorizationContext,
	ForbiddenError,
	CredentialStorage,
	Password,
	setAddUserToContext,
	ApplyAccessControlList,
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

const beforeRead = async <C extends AuthorizationContext>(params: MetadataHookParams<C>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
	return params;
};

setAddUserToContext(async () => user);

ApplyAccessControlList({
	Everyone: {
		all: () => false,
	},
})(AdminUiMetadata);

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
