import { BackendProvider, Resolver, Sort } from '@exogee/graphweaver';

import {
	BaseOneTimePasswordAuthResolver,
	OneTimePassword,
	OneTimePasswordData,
} from './base-resolver';
import { AuthenticationType } from '../../../types';
import { AuthenticationBaseEntity } from '../../entities';
import { AuthenticationError } from 'apollo-server-errors';

type OneTimePasswordProvider = BackendProvider<
	AuthenticationBaseEntity<OneTimePasswordData>,
	AuthenticationBaseEntity<OneTimePasswordData>
>;

@Resolver()
export class OneTimePasswordAuthResolver extends BaseOneTimePasswordAuthResolver {
	private provider: OneTimePasswordProvider;

	constructor({ provider }: { provider: OneTimePasswordProvider }) {
		super();
		this.provider = provider;
	}
	/**
	 * Return a specific OTP for this user
	 * @param userId users ID
	 * @param code code string
	 * @returns Array of OTP compatible entities
	 */
	async getOTP(userId: string, code: string): Promise<OneTimePassword> {
		const result = await this.provider.find(
			{
				type: AuthenticationType.OneTimePasswordChallenge,
				userId,
				data: { code, redeemedAt: 'null' },
			},
			{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
		);

		const [otp] = result;
		if (!otp) throw new AuthenticationError('Authentication Failed: OTP not found');
		return otp;
	}

	/**
	 * Return all otp that are valid in the current period for this user
	 * @param userId user ID to search for
	 * @param period the earliest date that is valid for this period
	 * @returns OTP compatible entity
	 */
	async getOTPs(userId: string, period: Date): Promise<OneTimePassword[]> {
		return await this.provider.find({
			type: AuthenticationType.OneTimePasswordChallenge,
			userId,
			createdAt_gt: period,
		} as {
			type: AuthenticationType.OneTimePasswordChallenge;
			userId: string;
			createdAt_gt: Date;
		});
	}

	/**
	 * A callback to persist the OTP in the data source of choice
	 * @param userId user ID to search for
	 * @param code the code generated for this OTP
	 * @returns OTP compatible entity
	 */
	async createOTP(userId: string, code: string): Promise<OneTimePassword> {
		const link = await this.provider.createOne({
			type: AuthenticationType.OneTimePasswordChallenge,
			userId,
			data: {
				code,
				redeemedAt: 'null',
			},
		});
		return link;
	}

	/**
	 * A callback to persist the redeeming of an OTP
	 * @param otp the otp that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemOTP({ id }: OneTimePassword): Promise<boolean> {
		if (!id) throw new AuthenticationError('Authentication Failed: OTP not found');

		const otp = await this.provider.findOne({
			id,
		});

		if (!otp) {
			throw new AuthenticationError('Authentication Failed: OTP not found');
		}

		await this.provider.updateOne(id, {
			data: {
				...otp.data,
				redeemedAt: new Date(),
			},
		});

		return true;
	}

	/**
	 * A callback that can be used to send the OTP via channels such as email or SMS
	 * @param otp the OTP that was generated and should be sent to the user
	 * @returns a boolean to indicate that the code has been sent
	 */
	async sendOTP(otp: OneTimePassword): Promise<boolean> {
		// In a production system this would email / sms the OTP and you would not log to the console!
		console.log(`\n\n ######## OTP: ${otp.data.code} ######## \n\n`);
		return true;
	}
}
