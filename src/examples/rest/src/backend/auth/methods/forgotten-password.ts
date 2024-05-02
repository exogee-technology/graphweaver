import {
	Credential,
	ForgottenPassword,
	ForgottenPasswordLinkData,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { graphweaverMetadata } from '@exogee/graphweaver';

import { Authentication, Credential as OrmCredential } from '../../entities/mysql';
import { myConnection } from '../../database';

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
