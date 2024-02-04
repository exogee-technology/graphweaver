import { BackendProvider, Resolver } from '@exogee/graphweaver';

import { AuthenticationBaseEntity } from '../../entities';
import {
	ForgottenPasswordLink,
	ForgottenPasswordLinkData,
	createBaseForgottenPasswordLinkAuthResolver,
} from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationType } from '../../../types';
import { AuthenticationError } from 'apollo-server-errors';

type ForgottenPasswordLinkProvider = BackendProvider<
	AuthenticationBaseEntity<ForgottenPasswordLinkData>,
	AuthenticationBaseEntity<ForgottenPasswordLinkData>
>;
@Resolver()
export class ForgottenPasswordLinkAuthResolver extends createBaseForgottenPasswordLinkAuthResolver() {
	private provider: ForgottenPasswordLinkProvider;

	constructor({ provider }: { provider: ForgottenPasswordLinkProvider }) {
		super();
		this.provider = provider;
	}
	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	async getUser(username: string): Promise<UserProfile> {
		throw new Error(
			'Method getUser not implemented: Override this function to return a user profile'
		);
	}

	/**
	 * Return a specific token for this user
	 * @param userId users ID
	 * @param token token string
	 * @returns Array of ForgottenPasswordLink compatible entities
	 */
	async getForgottenPasswordLink(userId: string, token: string): Promise<ForgottenPasswordLink> {
		const link = await this.provider.findOne({
			type: AuthenticationType.ForgottenPasswordLink,
			userId,
			data: {
				token,
				redeemedAt: 'null',
			},
		});

		if (!link) throw new AuthenticationError('Authentication Failed: Link not found');
		return link;
	}

	/**
	 * Return all magic links that are valid in the current period for this user
	 * @param userId user ID to search for
	 * @param period the earliest date that is valid for this period
	 * @returns ForgottenPasswordLink compatible entity
	 */
	async getForgottenPasswordLinks(userId: string, period: Date): Promise<ForgottenPasswordLink[]> {
		return this.provider.find({
			type: AuthenticationType.ForgottenPasswordLink,
			userId,
			createdAt_gt: period,
		} as {
			type: AuthenticationType.ForgottenPasswordLink;
			userId: string;
			createdAt_gt: Date;
		});
	}

	/**
	 * A callback to persist the Magic Link in the data source of choice
	 * @param userId user ID to search for
	 * @param token the token generated for this magic link
	 * @returns ForgottenPasswordLink compatible entity
	 */
	async createForgottenPasswordLink(userId: string, token: string): Promise<ForgottenPasswordLink> {
		const link = await this.provider.createOne({
			type: AuthenticationType.ForgottenPasswordLink,
			userId,
			data: {
				token,
				redeemedAt: 'null',
			},
		});
		return link;
	}

	/**
	 * A callback to persist the redeeming of a Magic Link
	 * @param forgottenPasswordLink the forgottenPasswordLink that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemForgottenPasswordLink({ id }: ForgottenPasswordLink): Promise<boolean> {
		if (!id) throw new AuthenticationError('Authentication Failed: Magic Link not found');

		const link = await this.provider.findOne({
			id,
		});

		if (!link) {
			throw new AuthenticationError('Authentication Failed: Magic Link not found');
		}

		await this.provider.updateOne(id, {
			data: {
				...link.data,
				redeemedAt: new Date(),
			},
		});

		return true;
	}

	/**
	 * A callback that can be used to send the magic link via channels such as email or SMS
	 * @param forgottenPasswordLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendForgottenPasswordLink(
		url: URL,
		forgottenPasswordLink: ForgottenPasswordLink
	): Promise<boolean> {
		//Override this method in your implementation to send the OTP to the user
		throw new Error(
			'Method sendForgottenPasswordLink not implemented: Override this function to send a Magic Link.'
		);
	}
}
