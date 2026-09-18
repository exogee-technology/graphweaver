import { MagicLink, MagicLinkData, MagicLinkEntity, UserProfile } from '@exogee/graphweaver-auth';
import { BaseLoaders, fromBackendEntity } from '@exogee/graphweaver';

import { mapUserToProfile } from '../../auth/context';
import { User } from '../../schema/user';
import { Roles } from '../roles';
import { authenticationProviderFor, credentialProvider } from '../storage';

export const magicLink = new MagicLink({
	provider: authenticationProviderFor<MagicLinkData>(),
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	getUser: async (username: string): Promise<UserProfile<Roles>> => {
		const credential = await credentialProvider.findOne({ username });
		if (!credential) throw new Error('Bad Request: Unknown username provided.');

		const user = fromBackendEntity(
			User,
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
	// This example is ok to show people what's passed in, we don't need to use this var.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	sendMagicLink: async (url: URL, _magicLink: MagicLinkEntity): Promise<boolean> => {
		// In a production system this would email / sms the magic link and you would not log to the console!
		console.log(`\n\n ######## MagicLink: ${url.toString()} ######## \n\n`);
		return true;
	},
});
