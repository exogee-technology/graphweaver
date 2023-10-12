import { PasswordAuthResolver as AuthResolver, UserProfile } from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User } from '../../user';
import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';

@Resolver()
export class PasswordAuthResolver extends AuthResolver {
	constructor() {
		super({
			provider: new MikroBackendProvider(Credential, myConnection),
		});
	}

	async getUser(id: string): Promise<UserProfile> {
		const user = User.fromBackendEntity(await BaseLoaders.loadOne({ gqlEntityType: User, id }));

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	}
}
