import {
	OneTimePasswordAuthResolver as AuthResolver,
	OneTimePassword,
	OneTimePasswordData,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { Authentication, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';

@Resolver()
export class OneTimePasswordAuthResolver extends AuthResolver {
	constructor() {
		super({
			provider: new MikroBackendProvider(Authentication<OneTimePasswordData>, myConnection),
		});
	}

	/**
	 * A callback that can be used to send the OTP via channels such as email or SMS
	 * @param otp the OTP that was generated and should be sent to the user
	 * @returns a boolean to indicate that the code has been sent
	 */
	async sendOTP(otp: OneTimePassword): Promise<boolean> {
		// In a production system this would email / sms the OTP and you would not log to the console!
		console.log(`\n\n ######## One Time Password Code: ${otp.data.code} ######## \n\n`);
		return true;
	}
}
