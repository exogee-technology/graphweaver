import {
	createForgottenPasswordAuthResolver,
	Credential,
	ForgottenPasswordLinkData,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, Filter, graphweaverMetadata, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import {
	Credential as OrmCredential,
	Authentication as OrmAuthentication,
} from '../../../entities/mysql';
import { ForgottenPasswordLink } from './entity';

@Resolver()
export class ForgottenPasswordLinkResolver extends createForgottenPasswordAuthResolver<
	OrmAuthentication<ForgottenPasswordLinkData>
>(
	ForgottenPasswordLink,
	new MikroBackendProvider(OrmAuthentication<ForgottenPasswordLinkData>, myConnection)
) {
	/**
	 * A callback that can be used to send the forgotten link via channels such as email or SMS
	 * @param url the URL that was generated and should be sent to the user
	 * @param forgotPasswordLink the forgotten password link entity that was generated
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendForgottenPasswordLink(url: URL): Promise<boolean> {
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
		const provider = graphweaverMetadata.getEntity<OrmCredential, Credential<OrmCredential>>(
			'Credential'
		)?.provider;

		if (!provider)
			throw new Error('Bad Request: No provider associated with the Credential entity.');

		const user = await provider?.findOne({ username });

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return user;
	}
}
