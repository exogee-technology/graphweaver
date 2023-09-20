import { PasswordAuthResolver } from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import * as argon2 from 'argon2';

import { User } from '../user';
import { mapUserToProfile } from '../../auth/context';
import { myConnection } from '../../database';
import { Credential } from '../../entities/mysql';

@Resolver()
export class AuthResolver extends PasswordAuthResolver {
	async authenticate(username: string, password: string) {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const credential = await database.em.findOneOrFail(Credential, { username });

		if (await argon2.verify(credential.password, password)) {
			const user = User.fromBackendEntity(
				await BaseLoaders.loadOne({ gqlEntityType: User, id: credential.id })
			);

			if (!user) throw new Error('Bad Request: Unknown user id provided.');

			return mapUserToProfile(user);
		}

		throw new Error('Authentication Failed: Unknown username or password.');
	}
}
