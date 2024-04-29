import { PasswordOperation, UserProfile, Password } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { AccessControlList, AuthorizationContext } from '@exogee/graphweaver-auth';

import { User } from '../../schema/user';
import { mapUserToProfile } from '../context';
import { myConnection } from '../../database';
import { Credential as OrmCredential } from '../../entities/mysql';
import { BaseLoaders } from '@exogee/graphweaver';

const acl: AccessControlList<Credential, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own credentials
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any credentials
		all: true,
	},
};

export const password = new Password({
	provider: new MikroBackendProvider(OrmCredential, myConnection),
	acl,
	// This is called when a user has logged in to get the profile
	getUserProfile: async (id: string, operation: PasswordOperation): Promise<UserProfile> => {
		const user = User.fromBackendEntity(await BaseLoaders.loadOne({ gqlEntityType: User, id }));

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		if (operation === PasswordOperation.REGISTER) {
			// As an example we could send an email to the newly registered user
		}

		return mapUserToProfile(user);
	},
});
