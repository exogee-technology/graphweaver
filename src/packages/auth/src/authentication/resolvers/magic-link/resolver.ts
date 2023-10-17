import { BackendProvider, Resolver } from '@exogee/graphweaver';

import { AuthenticationBaseEntity } from '../../entities';
import { MagicLink, MagicLinkData, createBaseMagicLinkAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationType } from '../../../types';
import { AuthenticationError } from 'apollo-server-errors';

type MagicLinkProvider = BackendProvider<
	AuthenticationBaseEntity<MagicLinkData>,
	AuthenticationBaseEntity<MagicLinkData>
>;
@Resolver()
export class MagicLinkAuthResolver extends createBaseMagicLinkAuthResolver() {
	private provider: MagicLinkProvider;

	constructor({ provider }: { provider: MagicLinkProvider }) {
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
	 * @returns Array of MagicLink compatible entities
	 */
	async getMagicLink(userId: string, token: string): Promise<MagicLink> {
		const link = await this.provider.findOne({
			type: AuthenticationType.MagicLinkChallenge,
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
	 * @returns MagicLink compatible entity
	 */
	async getMagicLinks(userId: string, period: Date): Promise<MagicLink[]> {
		return this.provider.find({
			type: AuthenticationType.MagicLinkChallenge,
			userId,
			createdAt_gt: period,
		} as {
			type: AuthenticationType.MagicLinkChallenge;
			userId: string;
			createdAt_gt: Date;
		});
	}

	/**
	 * A callback to persist the Magic Link in the data source of choice
	 * @param userId user ID to search for
	 * @param token the token generated for this magic link
	 * @returns MagicLink compatible entity
	 */
	async createMagicLink(userId: string, token: string): Promise<MagicLink> {
		const link = await this.provider.createOne({
			type: AuthenticationType.MagicLinkChallenge,
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
	 * @param magicLink the magicLink that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemMagicLink({ id }: MagicLink): Promise<boolean> {
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
	 * @param magicLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	async sendMagicLink(url: URL, magicLink: MagicLink): Promise<boolean> {
		//Override this method in your implementation to send the OTP to the user
		throw new Error(
			'Method sendMagicLink not implemented: Override this function to send a Magic Link.'
		);
	}
}
