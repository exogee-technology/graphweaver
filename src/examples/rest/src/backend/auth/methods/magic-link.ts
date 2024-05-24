import { MagicLink, MagicLinkData, MagicLinkEntity, UserProfile } from '@exogee/graphweaver-auth';
import { BaseLoaders } from '@exogee/graphweaver';
import { ConnectionManager, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { mapUserToProfile } from '../../auth/context';
import { myConnection } from '../../database';
import { Credential, Authentication } from '../../entities/mysql';
import { User } from '../../schema/user';

export const magicLink = new MagicLink({
	provider: new MikroBackendProvider(Authentication<MagicLinkData>, myConnection),
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	getUser: async (username: string): Promise<UserProfile> => {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const credential = await database.em.findOneOrFail(Credential, { username });

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: credential.id })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	},
	/**
	 * A callback that can be used to send the magic link via channels such as email or SMS
	 * @param magicLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	sendMagicLink: async (url: URL, _magicLink: MagicLinkEntity): Promise<boolean> => {
		// In a production system this would email / sms the magic link and you would not log to the console!
		console.log(`\n\n ######## MagicLink: ${url.toString()} ######## \n\n`);
		return true;
	},
});
