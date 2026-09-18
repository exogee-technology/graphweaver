import { BaseLoaders, fromBackendEntity } from '@exogee/graphweaver';
import { UserProfile, setAddUserToContext } from '@exogee/graphweaver-auth';

import { User } from '../schema/user';
import { Roles } from './roles';
import { credentialProvider } from './storage';

export const mapUserToProfile = async (user: User): Promise<UserProfile<Roles>> => {
	const credential = await credentialProvider.findOne({ id: user.url });
	if (!credential) throw new Error('Bad Request: Unknown credential id provided.');

	return new UserProfile({
		id: user.url,
		roles: user.name === 'Darth Vader' ? [Roles.DARK_SIDE] : [Roles.LIGHT_SIDE],
		displayName: user.name,
		username: credential.username,
	});
};

// This function is called from the authentication provider
// You must fetch the user by ID and return a UserProfile, which is added to the context
const addUserToContext = async (userId: string) => {
	const user = fromBackendEntity(
		User,
		await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
	);

	if (!user) throw new Error('Bad Request: Unknown user id provided.');

	return await mapUserToProfile(user);
};

// We then pass the function to the auth module to be called when a user is authenticated
setAddUserToContext(addUserToContext);
