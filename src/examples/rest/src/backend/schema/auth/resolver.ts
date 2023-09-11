import { PasswordAuthResolver } from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';

import { User } from '../user';
import { credentials } from '../../entities/memory/credentials';
import { mapUserToProfile } from '../../auth/context';

@Resolver()
export class AuthResolver extends PasswordAuthResolver {
	async authenticate(username: string, password: string) {
		const login = credentials.find(
			(login) => login.username === username && login.password === password
		);

		if (!login) throw new Error('Unknown username or password, please try again');

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: login.id })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	}
}
