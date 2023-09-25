import {
	MagicLinkAuthResolver as AuthResolver,
	MagicLink as MagicLinkInterface,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { ConnectionManager, wrap } from '@exogee/graphweaver-mikroorm';

import { addUserToContext } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';
import { MagicLink } from '../../../entities/mysql/magic-link';

@Resolver()
export class MagicLinkAuthResolver extends AuthResolver {
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	async getUser(username: string): Promise<UserProfile> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const credential = await database.em.findOneOrFail(Credential, { username });
		return addUserToContext(credential.id);
	}

	/**
	 * Return a specific token for this user
	 * @param userId users ID
	 * @param token token string
	 * @returns Array of MagicLink compatible entities
	 */
	async getMagicLink(userId: string, token: string): Promise<MagicLinkInterface> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		return await database.em.findOneOrFail(MagicLink, { userId, token, redeemedAt: null });
	}

	/**
	 * Return all magic links that are valid in the current period for this user
	 * @param userId user ID to search for
	 * @param period the earliest date that is valid for this period
	 * @returns MagicLink compatible entity
	 */
	async getMagicLinks(userId: string, period: Date): Promise<MagicLinkInterface[]> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		return await database.em.find(MagicLink, {
			userId,
			createdAt: {
				$gt: period,
			},
		});
	}

	/**
	 * A callback to persist the Magic Link in the data source of choice
	 * @param userId user ID to search for
	 * @param token the token generated for this magic link
	 * @returns MagicLink compatible entity
	 */
	async createMagicLink(userId: string, token: string): Promise<MagicLinkInterface> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const link = new MagicLink();
		wrap(link).assign(
			{
				userId,
				token,
			},
			{ em: database.em }
		);
		await database.em.persistAndFlush(link);
		return link;
	}

	/**
	 * A callback to persist the redeeming of a Magic Link
	 * @param magicLink the magicLink that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemMagicLink({ id }: MagicLink): Promise<boolean> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const link = await database.em.findOneOrFail(MagicLink, { id });
		link.redeemedAt = new Date();
		await database.em.persistAndFlush(link);
		return true;
	}

	/**
	 * A callback that can be used to send the magic link via channels such as email or SMS
	 * @param magicLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendMagicLink(magicLink: URL): Promise<boolean> {
		// In a production system this would email / sms the magic link and you would not log to the console!
		console.log(`\n\n ######## MagicLink: ${magicLink.toString()} ######## \n\n`);
		return true;
	}
}
