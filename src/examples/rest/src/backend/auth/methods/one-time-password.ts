import { OneTimePassword, OneTimePasswordData } from '@exogee/graphweaver-auth';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Authentication } from '../../entities/mysql';
import { myConnection } from '../../database';

export const oneTimePassword = new OneTimePassword({
	provider: new MikroBackendProvider(Authentication<OneTimePasswordData>, myConnection),
	sendOTP: async (otp) => {
		// In a production system this would email / sms the OTP and you would not log to the console!
		console.log(`\n\n ######## One Time Password Code: ${otp.data.code} ######## \n\n`);
		return true;
	},
});
