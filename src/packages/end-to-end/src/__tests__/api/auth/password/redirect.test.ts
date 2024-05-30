import gql from 'graphql-tag';
import Graphweaver, { MetadataHookParams } from '@exogee/graphweaver-server';
import { BaseDataProvider } from '@exogee/graphweaver';
import {
	authApolloPlugin,
	UserProfile,
	AuthorizationContext,
	ForbiddenError,
	CredentialStorage,
	Password,
	PasswordOperation,
} from '@exogee/graphweaver-auth';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (id: string, operation: PasswordOperation): Promise<UserProfile<unknown>> =>
		user,
});

const beforeRead = async <C extends AuthorizationContext>(params: MetadataHookParams<C>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
	return params;
};

const graphweaver = new Graphweaver({
	apolloServerOptions: {
		plugins: [authApolloPlugin(async () => user)],
	},
	adminMetadata: {
		enabled: true,
		hooks: {
			beforeRead,
		},
	},
});

describe('Password Authentication - Redirect', () => {
	test('should redirect an unauthenticated user to the login screen.', async () => {
		const response = await graphweaver.server.executeOperation({
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
