import 'reflect-metadata';
import gql from 'graphql-tag';
import Graphweaver, { MetadataHookParams } from '@exogee/graphweaver-server';
import { CreateOrUpdateHookParams, Resolver } from '@exogee/graphweaver';
import {
	createBasePasswordAuthResolver,
	authApolloPlugin,
	UserProfile,
	AuthorizationContext,
	ForbiddenError,
	Credential,
	RequestParams,
	CredentialCreateOrUpdateInputArgs,
} from '@exogee/graphweaver-auth';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
});

@Resolver()
class AuthResolver extends createBasePasswordAuthResolver(
	Credential,
	new MikroBackendProvider(class OrmCred extends BaseEntity {}, {})
) {
	async authenticate(username: string, password: string) {
		return user;
	}
	async create(params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>) {
		return user;
	}
	async update(
		params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
	): Promise<UserProfile> {
		return user;
	}
}

const beforeRead = async <C extends AuthorizationContext>(params: MetadataHookParams<C>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
	return params;
};

const graphweaver = new Graphweaver({
	resolvers: [AuthResolver],
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
