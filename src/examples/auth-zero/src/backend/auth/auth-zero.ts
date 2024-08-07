import { UserProfile, AuthZero, setAddUserToContext } from '@exogee/graphweaver-auth';

export const authZero = new AuthZero();

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['everyone'],
	});
};
// This function is called when a user logs in
setAddUserToContext(addUserToContext);
