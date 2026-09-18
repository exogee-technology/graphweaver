import { Web3, AuthenticationMethod, WalletAddress } from '@exogee/graphweaver-auth';
import { authenticationProviderFor } from '../storage';

export const web3 = new Web3({
	provider: authenticationProviderFor<WalletAddress>(),
	multiFactorAuthentication: async () => {
		return {
			Everyone: {
				// all users must provide a OTP mfa when saving a wallet address
				Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.ONE_TIME_PASSWORD] }],
			},
		};
	},
});
