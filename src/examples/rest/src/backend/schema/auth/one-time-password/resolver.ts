import {
	OneTimePasswordAuthResolver as AuthResolver,
	OTP as OTPInterface,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import { ConnectionManager, DatabaseImplementation, wrap } from '@exogee/graphweaver-mikroorm';

import { addUserToContext } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';
import { OneTimePassword } from '../../../entities/mysql';

@Resolver()
export class OneTimePasswordAuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	async getUser(username: string): Promise<UserProfile> {
		const credential = await this.database.em.findOneOrFail(Credential, { username });
		return addUserToContext(credential.id);
	}

	/**
	 * Return a specific token for this user
	 * @param userId users ID
	 * @param token token string
	 * @returns Array of OTP compatible entities
	 */
	async getOTP(userId: string, code: string): Promise<OTPInterface> {
		return this.database.em.findOneOrFail(OneTimePassword, { userId, code, redeemedAt: null });
	}

	/**
	 * Return all otp that are valid in the current period for this user
	 * @param userId user ID to search for
	 * @param period the earliest date that is valid for this period
	 * @returns OTP compatible entity
	 */
	async getOTPs(userId: string, period: Date): Promise<OTPInterface[]> {
		return this.database.em.find(OneTimePassword, {
			userId,
			createdAt: {
				$gt: period,
			},
		});
	}

	/**
	 * A callback to persist the OTP in the data source of choice
	 * @param userId user ID to search for
	 * @param token the token generated for this OTP
	 * @returns OTP compatible entity
	 */
	async createOTP(userId: string, code: string): Promise<OTPInterface> {
		const link = new OneTimePassword();
		wrap(link).assign(
			{
				userId,
				code,
			},
			{ em: this.database.em }
		);
		await this.database.em.persistAndFlush(link);
		return link;
	}

	/**
	 * A callback to persist the redeeming of an OTP
	 * @param otp the otp that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemOTP({ id }: OTPInterface): Promise<boolean> {
		const otp = await this.database.em.findOneOrFail(OneTimePassword, { id });
		otp.redeemedAt = new Date();
		await this.database.em.persistAndFlush(otp);
		return true;
	}

	/**
	 * A callback that can be used to send the OTP via channels such as email or SMS
	 * @param otp the OTP that was generated and should be sent to the user
	 * @returns a boolean to indicate that the code has been sent
	 */
	async sendOTP(otp: OTPInterface): Promise<boolean> {
		// In a production system this would email / sms the OTP and you would not log to the console!
		console.log(`\n\n ######## OTP: ${otp.code} ######## \n\n`);
		return true;
	}
}
