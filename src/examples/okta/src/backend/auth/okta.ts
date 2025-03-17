import { UserProfile, Okta, setAddUserToContext } from '@exogee/graphweaver-auth';

export const okta = new Okta();

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['everyone'],
	});
};
// This function is called when a user logs in
setAddUserToContext(addUserToContext);
