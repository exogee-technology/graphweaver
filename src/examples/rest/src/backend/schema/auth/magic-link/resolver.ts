import {
	MagicLinkAuthResolver as AuthResolver,
	MagicLink,
	MagicLinkData,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { ConnectionManager, Database, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { addUserToContext } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Authentication, Credential } from '../../../entities/mysql';

@Resolver()
export class MagicLinkAuthResolver extends AuthResolver {
	private database: Database;
	constructor() {
		super({
			provider: new MikroBackendProvider(Authentication<MagicLinkData>, myConnection),
		});
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	async getUser(username: string): Promise<UserProfile> {
		const credential = await this.database.em.findOneOrFail(Credential, { username });
		return addUserToContext(credential.id);
	}

	/**
	 * A callback that can be used to send the magic link via channels such as email or SMS
	 * @param magicLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendMagicLink(url: URL, magicLink: MagicLink): Promise<boolean> {
		// In a production system this would email / sms the magic link and you would not log to the console!
		console.log(`\n\n ######## MagicLink: ${url.toString()} ######## \n\n`);
		return true;
	}
}
