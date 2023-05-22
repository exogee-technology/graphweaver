import { AuthProvider, LocalAuthResolver, UserProfile } from '@exogee/graphweaver-auth';
import { Resolver } from 'type-graphql';
import { User } from '../user';
import { BaseLoaders } from '@exogee/graphweaver';
import { Roles } from '../..';

const logins = [{ id: '4', username: 'darth', password: 'deathstar123' }];

@Resolver()
export class AuthResolver extends LocalAuthResolver {
	async authenticate(username: string, password: string) {
		const login = logins.find(
			(login) => login.username === username && login.password === password
		);

		if (!login) throw new Error('Unknown username or password, please try again');

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: login.id })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		const userProfile = new UserProfile({
			id: user.id,
			provider: AuthProvider.LOCAL,
			roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
		});

		return userProfile;
	}
}
