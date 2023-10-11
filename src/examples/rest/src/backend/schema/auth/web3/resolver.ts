import {
	Web3AuthResolver as AuthResolver,
	AuthenticationMethod,
	MultiFactorAuthentication,
	WalletAddress,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import { Authentication } from '../../../entities/mysql';

@Resolver()
export class Web3AuthResolver extends AuthResolver {
	constructor() {
		super({
			web3AuthProvider: new MikroBackendProvider(Authentication<WalletAddress>, myConnection),
		});
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
}
