import { BaseLoaders } from '@exogee/graphweaver';
import { AuthProvider, UserProfile } from '@exogee/graphweaver-auth';

import { User } from '../schema/user';
import { Roles } from '..';
import { credentials } from '../entities/memory/credentials';

export const mapUserToProfile = (user: User): UserProfile => {
	const login = credentials.find((login) => login.id === user.id);
	return new UserProfile({
		id: user.id,
		roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
		displayName: user.name,
		username: login.username,
	});
};

export const addUserToContext = async (userId: string) => {
	const user = User.fromBackendEntity(
		await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
	);

	if (!user) throw new Error('Bad Request: Unknown user id provided.');

	return mapUserToProfile(user);
};
