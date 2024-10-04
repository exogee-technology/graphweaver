import { UserProfile, MicrosoftEntra, setAddUserToContext } from '@exogee/graphweaver-auth';

export const microsoftEntra = new MicrosoftEntra();

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['everyone'],
	});
};
// This function is called when a user logs in
setAddUserToContext(addUserToContext);
