import { BackendProvider, Resolver } from '@exogee/graphweaver';

import { createBaseWeb3AuthResolver } from './base-resolver';
import { AuthenticationBaseEntity } from '../../entities';
import {
	AuthenticationMethod,
	AuthenticationType,
	MultiFactorAuthentication,
} from '../../../types';

export type WalletAddress = {
	address: string;
};

type Web3AuthProvider = BackendProvider<
	AuthenticationBaseEntity<WalletAddress>,
	AuthenticationBaseEntity<WalletAddress>
>;

@Resolver()
export class Web3AuthResolver extends createBaseWeb3AuthResolver() {
	private provider: Web3AuthProvider;
	constructor({ web3AuthProvider }: { web3AuthProvider: Web3AuthProvider }) {
		super();
		this.provider = web3AuthProvider;
	}
	/**
	 * Secure the save wallet address mutation using a multi factor rule
	 * @returns return a MultiFactorAuthentication compatible rule
	 */
	async getMultiFactorAuthentication(): Promise<MultiFactorAuthentication> {
		// Override this function to change the MFA rules
		return {
			Everyone: {
				// all users must provide a OTP mfa when saving a wallet address
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.PASSWORD] }],
			},
		};
	}

	/**
	 * Retrieve the user profile that matches the logged in user and wallet address
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async getWalletAddress(
		userId: string,
		address: string
	): Promise<AuthenticationBaseEntity<WalletAddress>> {
		const device = await this.provider.findOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		if (!device) throw new Error('Bad Request: Unknown user wallet address provided.');

		return device;
	}

	/**
	 * Save the wallet address and associate with this user
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a boolean if successful
	 */
	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
		// Let's check if we already have this combination in the database
		const existingDevice = await this.provider.findOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		// It is found so no need to add it again
		if (existingDevice) return true;

		// Insert the new wallet address into the database
		await this.provider.createOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		return true;
	}
}
