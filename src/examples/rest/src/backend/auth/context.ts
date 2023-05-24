import { BaseLoaders } from '@exogee/graphweaver';
import { AuthProvider, UserProfile } from '@exogee/graphweaver-auth';

import { User } from '../schema/user';
import { Roles } from '..';

export const mapUserToProfile = (user: User): UserProfile => {
	return new UserProfile({
		id: user.id,
		provider: AuthProvider.LOCAL,
		roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
		displayName: user.name,
	});
};

export const addUserToContext = async (userId: string) => {
	const user = User.fromBackendEntity(
		await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
	);

	if (!user) throw new Error('Bad Request: Unknown user id provided.');

	return mapUserToProfile(user);
};
