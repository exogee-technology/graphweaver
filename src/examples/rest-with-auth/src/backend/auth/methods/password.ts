import {
	PasswordOperation,
	UserProfile,
	Password,
	Credential,
	ForgottenPassword,
	ForgottenPasswordLinkData,
} from '@exogee/graphweaver-auth';
import { AccessControlList, AuthorizationContext } from '@exogee/graphweaver-auth';
import { BaseLoaders, fromBackendEntity } from '@exogee/graphweaver';

import { User } from '../../schema/user';
import { mapUserToProfile } from '../context';
import { Roles } from '../roles';
import { authenticationProviderFor, credentialProvider } from '../storage';

export const forgottenPassword = new ForgottenPassword({
	provider: authenticationProviderFor<ForgottenPasswordLinkData>(),
	/**
	 * A callback that can be used to send the forgotten link via channels such as email or SMS
	 * @param url the URL that was generated and should be sent to the user
	 * @param forgotPasswordLink the forgotten password link entity that was generated
	 * @returns a boolean to indicate that the URL has been sent
	 */
	sendForgottenPasswordLink: async (url: URL): Promise<boolean> => {
		// In a production system this would email / sms the forgotten link and you would not log to the console!
		console.log(`\n\n ######## ForgotPasswordLink: ${url.toString()} ######## \n\n`);
		return true;
	},

	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	getUser: async (username: string): Promise<UserProfile<Roles>> => {
		const user = await credentialProvider.findOne({ username });

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return user;
	},
});

const acl: AccessControlList<Credential, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform read operations on their own credentials
		read: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any credentials
		all: true,
	},
};

export const password = new Password({
	provider: credentialProvider,
	acl,
	// This is called when a user has logged in to get the profile
	getUserProfile: async (id: string, operation: PasswordOperation): Promise<UserProfile<Roles>> => {
		const user = fromBackendEntity(User, await BaseLoaders.loadOne({ gqlEntityType: User, id }));

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		if (operation === PasswordOperation.REGISTER) {
			// As an example we could send an email to the newly registered user
		}

		return mapUserToProfile(user);
	},
});
