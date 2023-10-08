import {
	Web3AuthResolver as AuthResolver,
	AuthenticationMethod,
	MultiFactorAuthentication,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { ConnectionManager, DatabaseImplementation, wrap } from '@exogee/graphweaver-mikroorm';

import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Authentication } from '../../../entities/mysql';
import { User } from '../../user';
import { AuthenticationType } from '..';

type WalletAddress = {
	address: string;
};

@Resolver()
export class Web3AuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}
	/**
	 * Secure the save wallet address mutation using a multi factor rule
	 * @returns return a MultiFactorAuthentication compatible rule
	 */
	async getMultiFactorAuthentication(): Promise<MultiFactorAuthentication> {
		return {
			Everyone: {
				// all users must provide a OTP mfa when saving a wallet address
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
			},
		};
	}

	/**
	 * Retrieve the user profile that matches the logged in user and wallet address
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async getUserByWalletAddress(userId: string, address: string): Promise<UserProfile> {
		const device = await this.database.em.findOneOrFail<Authentication<WalletAddress>>(
			Authentication,
			{
				type: AuthenticationType.Web3WalletAddress,
				userId,
				data: {
					address,
				},
			}
		);

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
	 * @returns return a boolean if successful
	 */
	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
		// Let's check if we already have this combination in the database
		const existingDevice = await this.database.em.findOne<Authentication<WalletAddress>>(
			Authentication,
			{
				type: AuthenticationType.Web3WalletAddress,
				userId,
				data: {
					address,
				},
			}
		);

		// It is found so no need to add it again
		if (existingDevice) return true;

		// Insert the new wallet address into the database
		const device = new Authentication<WalletAddress>();
		wrap(device).assign(
			{
				type: AuthenticationType.Web3WalletAddress,
				userId,
				data: {
					address,
				},
			},
			{ em: this.database.em }
		);
		await this.database.em.persistAndFlush(device);

		return true;
	}
}
