import { Web3AuthResolver as AuthResolver, UserProfile } from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { ConnectionManager, DatabaseImplementation } from '@exogee/graphweaver-mikroorm';

import { addUserToContext, mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';
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
	 * @param id of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async getUserByWalletAddress(id: string, address: string): Promise<UserProfile> {
		console.log(address);
		const credential = await this.database.em.findOneOrFail(Credential, {
			id,
			walletAddress: address,
		});

		if (!credential) throw new Error('Bad Request: Unknown user address provided.');

		const user = User.fromBackendEntity(
			await BaseLoaders.loadOne({ gqlEntityType: User, id: credential.id })
		);

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		return mapUserToProfile(user);
	}
}
