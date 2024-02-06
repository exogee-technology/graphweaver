import {
	createForgottenPasswordAuthResolver,
	ForgottenPasswordLink,
	ForgottenPasswordLinkData,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, EntityMetadataMap, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import {
	Credential as OrmCredential,
	Authentication as OrmAuthentication,
} from '../../../entities/mysql';
import { Authentication } from './entity';
import { mapCredentialToUserProfile, mapUserToProfile } from '../../../auth/context';

@Resolver()
export class ForgottenPasswordLinkResolver extends createForgottenPasswordAuthResolver<
	OrmAuthentication<ForgottenPasswordLinkData>
>(
	Authentication,
	new MikroBackendProvider(OrmAuthentication<ForgottenPasswordLinkData>, myConnection)
) {
	/**
	 * A callback that can be used to send the forgotten link via channels such as email or SMS
	 * @param url the URL that was generated and should be sent to the user
	 * @param forgotPasswordLink the forgotten password link entity that was generated
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendForgottenPasswordLink(
		url: URL,
		forgotPasswordLink: ForgottenPasswordLink
	): Promise<boolean> {
		// In a production system this would email / sms the forgotten link and you would not log to the console!
		console.log(`\n\n ######## ForgotPasswordLink: ${url.toString()} ######## \n\n`);
		return true;
	}

	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	async getUser(username: string): Promise<UserProfile> {
		//@todo - extend the base loaders to handle filters - find by filter.
		const provider = EntityMetadataMap.get('Credential')?.provider as MikroBackendProvider<
			OrmCredential,
			any
		>;

		if (!provider) throw new Error('Bad Request: Unknown provider.');

		const user = await provider?.findOne({ username });

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		console.log('********************\n');
		console.log('getUser user', user);
		console.log('********************\n');

		return user;
	}
}
