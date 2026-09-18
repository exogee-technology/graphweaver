import { OneTimePassword, OneTimePasswordData } from '@exogee/graphweaver-auth';
import { authenticationProviderFor } from '../storage';

export const oneTimePassword = new OneTimePassword({
	provider: authenticationProviderFor<OneTimePasswordData>(),
	sendOTP: async (otp) => {
		// In a production system this would email / sms the OTP and you would not log to the console!
		console.log(`\n\n ######## One Time Password Code: ${otp.data.code} ######## \n\n`);
		return true;
	},
});
