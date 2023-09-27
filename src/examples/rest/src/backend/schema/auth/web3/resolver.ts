import { Web3AuthResolver as AuthResolver, UserProfile } from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { ConnectionManager, DatabaseImplementation, wrap } from '@exogee/graphweaver-mikroorm';

import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Device } from '../../../entities/mysql';
import { User } from '../../user';

@Resolver()
export class Web3AuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}
	/**
	 * Check that the wallet address is associated with this user
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async getUserByWalletAddress(userId: string, address: string): Promise<UserProfile> {
		const device = await this.database.em.findOneOrFail(Device, {
			userId,
			address,
		});

		if (!device) throw new Error('Bad Request: Unknown user wallet address provided.');

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: userId })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	}

	/**
	 * Save the wallet address and associate with this user
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
		const device = new Device();
		wrap(device).assign(
			{
				userId,
				address,
			},
			{ em: this.database.em }
		);
		await this.database.em.persistAndFlush(device);

		return true;
	}
}
