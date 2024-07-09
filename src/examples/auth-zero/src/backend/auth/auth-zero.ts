import { UserProfile } from '@exogee/graphweaver-auth';

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['test'],
		displayName: 'Test User',
	});
};
