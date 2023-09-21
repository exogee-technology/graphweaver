import {
	MagicLinkAuthResolver as AuthResolver,
	MagicLink as MagicLinkInterface,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { ConnectionManager, wrap } from '@exogee/graphweaver-mikroorm';

import { User } from '../../user';
import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';
import { MagicLink } from '../../../entities/mysql/magic-link';

@Resolver()
export class MagicLinkAuthResolver extends AuthResolver {
	async getUser(username: string): Promise<UserProfile> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const credential = await database.em.findOneOrFail(Credential, { username });

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: credential.id })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	}

	async getMagicLink(userId: string, token: string): Promise<MagicLinkInterface> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		return await database.em.findOneOrFail(MagicLink, { userId, token });
	}

	async getMagicLinks(userId: string, period: Date): Promise<MagicLinkInterface[]> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		return await database.em.find(MagicLink, {
			userId,
			createdAt: {
				$gt: period,
			},
		});
	}

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

	async redeemMagicLink({ id }: MagicLink): Promise<boolean> {
		const database = ConnectionManager.database(myConnection.connectionManagerId);
		const link = await database.em.findOneOrFail(MagicLink, { id });
		link.redeemedAt = new Date();
		await database.em.persistAndFlush(link);
		return true;
	}

	async emailMagicLink(magicLink: MagicLink): Promise<boolean> {
		// In a production system this would email the magic link
		console.log(magicLink.token);
		return true;
	}
}
