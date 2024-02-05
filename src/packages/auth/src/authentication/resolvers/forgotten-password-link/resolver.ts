import {
	BackendProvider,
	BaseDataEntity,
	Filter,
	GraphqlEntityType,
	Resolver,
} from '@exogee/graphweaver';

import { Authentication, AuthenticationBaseEntity } from '../../entities';
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

export const createForgottenPasswordAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Authentication<D>, D>,
	provider: BackendProvider<D, Authentication<D>>
) => {
	console.log('createForgottenPasswordAuthResolver - provider', provider);
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
			forgottenPasswordLink: ForgottenPasswordLink
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

		// /**
		//  * Return a specific token for this user
		//  * @param userId users ID
		//  * @param token token string
		//  * @returns Array of ForgottenPasswordLink compatible entities
		//  */
		// async getForgottenPasswordLink(userId: string, token: string): Promise<ForgottenPasswordLink> {
		// 	const link = await this.provider.findOne({
		// 		type: AuthenticationType.ForgottenPasswordLink,
		// 		userId,
		// 		data: {
		// 			token,
		// 			redeemedAt: 'null',
		// 		},
		// 	});

		// 	if (!link) throw new AuthenticationError('Authentication Failed: Link not found');
		// 	return link;
		// }

		/**
		 * Return all magic links that are valid in the current period for this user
		 * @param userId user ID to search for
		 * @param period the earliest date that is valid for this period
		 * @returns ForgottenPasswordLink compatible entity
		 */
		async getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<ForgottenPasswordLink[]> {
			console.log('getForgottenPasswordLinks - provider', this.provider);

			const existingLinks = await this.provider.find({
				type: AuthenticationType.ForgottenPasswordLink,
				userId,
				createdAt_gt: period,
			} as Filter<Authentication<D>> & {
				createdAt_gt: Date; // @todo - extend filter<G> to include
			});

			console.log('existingLinks', existingLinks);
			return existingLinks.map((link) => {
				return link.data as ForgottenPasswordLink;
			});
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
		): Promise<ForgottenPasswordLink> {
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
	}

	return ForgottenPasswordLinkAuthResolver;
};
