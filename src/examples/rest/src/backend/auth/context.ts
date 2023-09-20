import { BaseLoaders } from '@exogee/graphweaver';
import { UserProfile } from '@exogee/graphweaver-auth';
import { ConnectionManager } from '@exogee/graphweaver-mikroorm';

import { User } from '../schema/user';
import { Roles } from '..';
import { Credential } from '../entities/mysql';
import { myConnection } from '../database';

export const mapUserToProfile = async (user: User): Promise<UserProfile> => {
	const database = ConnectionManager.database(myConnection.connectionManagerId);
	const credential = await database.em.findOneOrFail(Credential, { id: user.id });

	return new UserProfile({
		id: user.id,
		roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
		displayName: user.name,
		username: credential.username,
	});
};

// This function is called from the authentication provider
// You must fetch the user by ID and return a UserProfile, which is added to the context
export const addUserToContext = async (userId: string) => {
	const user = User.fromBackendEntity(
		await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
	);

	if (!user) throw new Error('Bad Request: Unknown user id provided.');

	return await mapUserToProfile(user);
};
