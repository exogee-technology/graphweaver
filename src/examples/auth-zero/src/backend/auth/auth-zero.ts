import { setAddUserToContext, setImplicitAllow, UserProfile } from '@exogee/graphweaver-auth';

export const addUserToContext = async (userId: string) => {
	return new UserProfile({
		id: userId,
		roles: ['everyone'],
	});
};

setAddUserToContext(addUserToContext);
setImplicitAllow(true);
