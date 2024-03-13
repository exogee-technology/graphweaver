import {
	BackendProvider,
	BaseDataEntity,
	Filter,
	GraphqlEntityType,
	Resolver,
} from '@exogee/graphweaver';

import { Authentication, AuthenticationBaseEntity } from '../../entities';
import {
	ForgottenPasswordLinkData,
	createBaseForgottenPasswordLinkAuthResolver,
} from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationType } from '../../../types';
import { AuthenticationError } from 'apollo-server-errors';

export type ForgottenPasswordLinkProvider = BackendProvider<
	AuthenticationBaseEntity<ForgottenPasswordLinkData>,
	AuthenticationBaseEntity<ForgottenPasswordLinkData>
>;

export const createForgottenPasswordAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Authentication<D>, D>,
	provider: ForgottenPasswordLinkProvider
) => {
	@Resolver()
	class ForgottenPasswordLinkAuthResolver extends createBaseForgottenPasswordLinkAuthResolver(
		gqlEntityType,
		provider
	) {
		provider = provider;
		/**
		 * A callback that can be used to send the magic link via channels such as email or SMS
		 * @param forgottenPasswordLink the URL that was generated and should be sent to the user
		 * @returns a boolean to indicate that the URL has been sent
		 */
		async sendForgottenPasswordLink(
			url: URL,
			forgottenPasswordLink: AuthenticationBaseEntity<ForgottenPasswordLinkData>
		): Promise<boolean> {
			// Override this method in your implementation to send the link to the user
			throw new Error(
				'Method sendForgottenPasswordLink not implemented: Override this function to send a Forgotten Password Link.'
			);
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
		 * @param token token string
		 * @returns ForgottenPasswordLink entity
		 */
		async getForgottenPasswordLink(
			token: string
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>> {
			const link = await this.provider.findOne({
				type: AuthenticationType.ForgottenPasswordLink,
				data: {
					token,
					redeemedAt: 'null',
				},
			});

			if (!link) throw new AuthenticationError('Authentication Failed: Link may have expired.');
			return link;
		}

		/**
		 * Return all magic links that are valid in the current period for this user
		 * @param userId user ID to search for
		 * @param period the earliest date that is valid for this period
		 * @returns ForgottenPasswordLink compatible entity
		 */
		async getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>[]> {
			const existingLinks = await this.provider.find({
				type: AuthenticationType.ForgottenPasswordLink,
				userId,
				createdAt_gt: period,
			});

			return existingLinks;
		}

		/**
		 * A callback to persist the Magic Link in the data source of choice
		 * @param userId user ID to search for
		 * @param token the token generated for this magic link
		 * @returns ForgottenPasswordLink compatible entity
		 */
		async createForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>> {
			const link = await this.provider.createOne({
				type: AuthenticationType.ForgottenPasswordLink,
				userId,
				data: {
					token,
					redeemedAt: 'null',
				},
				createdAt: new Date(),
			});

			return link;
		}
	}

	return ForgottenPasswordLinkAuthResolver;
};
