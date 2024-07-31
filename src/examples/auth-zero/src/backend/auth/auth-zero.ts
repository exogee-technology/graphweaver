import { UserProfile, AuthZero } from '@exogee/graphweaver-auth';

export const authZero = new AuthZero();

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['everyone'],
	});
};
