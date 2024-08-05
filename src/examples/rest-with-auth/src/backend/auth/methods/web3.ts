import { Web3, AuthenticationMethod, WalletAddress } from '@exogee/graphweaver-auth';

import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Authentication } from '../../entities/mysql';
import { myConnection } from '../../database';

export const web3 = new Web3({
	provider: new MikroBackendProvider(Authentication<WalletAddress>, myConnection),
	multiFactorAuthentication: async () => {
		return {
			Everyone: {
				// all users must provide a OTP mfa when saving a wallet address
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
			},
		};
	},
});
