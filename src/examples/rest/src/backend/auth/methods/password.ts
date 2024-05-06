import {
	PasswordOperation,
	UserProfile,
	Password,
	Credential,
	ForgottenPassword,
	ForgottenPasswordLinkData,
	CredentialStorage,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { AccessControlList, AuthorizationContext } from '@exogee/graphweaver-auth';
import { graphweaverMetadata } from '@exogee/graphweaver';

import { User } from '../../schema/user';
import { mapUserToProfile } from '../context';
import { myConnection } from '../../database';
import { Authentication, Credential as OrmCredential } from '../../entities/mysql';
import { BaseLoaders } from '@exogee/graphweaver';

export const forgottenPassword = new ForgottenPassword({
	provider: new MikroBackendProvider(Authentication<ForgottenPasswordLinkData>, myConnection),
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
	getUser: async (username: string): Promise<UserProfile> => {
		const provider = graphweaverMetadata.getEntityByName<Credential<OrmCredential>, OrmCredential>(
			'Credential'
		)?.provider;

		if (!provider)
			throw new Error('Bad Request: No provider associated with the Credential entity.');

		const user = await provider?.findOne({ username });

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return user;
	},
});

const acl: AccessControlList<Credential<CredentialStorage>, AuthorizationContext> = {
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
	provider: new MikroBackendProvider(OrmCredential, myConnection),
	acl,
	// This is called when a user has logged in to get the profile
	getUserProfile: async (id: string, operation: PasswordOperation): Promise<UserProfile> => {
		const user = User.fromBackendEntity(await BaseLoaders.loadOne({ gqlEntityType: User, id }));

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		if (operation === PasswordOperation.REGISTER) {
			// As an example we could send an email to the newly registered user
		}

		return mapUserToProfile(user);
	},
});
