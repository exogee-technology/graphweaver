process.env.PASSWORD_AUTH_REDIRECT_URI = '*';
process.env.PASSWORD_CHALLENGE_JWT_EXPIRES_IN = '30m';

import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider, Entity, Field, ID } from '@exogee/graphweaver';
import {
	UserProfile,
	Password,
	CredentialStorage,
	hashPassword,
	setImplicitAllow,
	setAddUserToContext,
} from '@exogee/graphweaver-auth';

@Entity('Tag', {
	provider: new BaseDataProvider('Tag'),
})
export class Tag {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}

const user = new UserProfile({
	id: '1',
	roles: ['admin'],
	displayName: 'Test User',
	username: 'test',
});

class PasswordBackendProvider extends BaseDataProvider<CredentialStorage> {
	async findOne() {
		const user: CredentialStorage = {
			id: '1',
			username: 'test',
			password: await hashPassword('test123'),
		};
		return user;
	}
}

export const password = new Password({
	provider: new PasswordBackendProvider('password'),
	getUserProfile: async (): Promise<UserProfile<unknown>> => {
		return new UserProfile({
			id: user.id,
			username: user.username,
		});
	},
});

setAddUserToContext(async () => user);
setImplicitAllow(true);

const graphweaver = new Graphweaver();

describe('Security', () => {
	test('should give the correct error for an invalid token', async () => {
		const response = await graphweaver.executeOperation<{
			challengePassword: { authToken: string };
		}>({
			http: { headers: new Headers({ authorization: 'Bearer mockToken' }) } as any,
			query: gql`
				query {
					tags {
						name
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0]?.message).toEqual(
			'Unauthorized: Token verification failed.'
		);
		expect(response.http.headers.get('X-Auth-Redirect')).toBe(
			`${process.env.AUTH_BASE_URI}/auth/login?redirect_uri=${encodeURIComponent(
				process.env.AUTH_BASE_URI + '/'
			)}`
		);
	});
});
