import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';

import { AuthorizationContext } from '../../../types';
import { UserProfile } from '../../../user-profile';
import { requireEnvironmentVariable } from '../../../helper-functions';
import {
	BaseDataEntity,
	GraphqlEntityType,
	BackendProvider,
	graphweaverMetadata,
	GraphQLEntity,
} from '@exogee/graphweaver';
import { Authentication, AuthenticationBaseEntity } from '../../entities';
import { defaultPasswordStrength } from '../utils';
import { ForgottenPasswordLinkProvider } from './resolver';
import { updatePasswordCredential } from '../utils';

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_FORGOTTEN_PASSWORD_LINK_RATE_LIMIT ?? '4'),
		period: process.env.AUTH_FORGOTTEN_PASSWORD_LINK_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_FORGOTTEN_PASSWORD_LINK_TTL || '15m',
};

export interface ForgottenPasswordLinkData {
	token: string;
	redeemedAt?: Date | 'null';
}

const createToken = randomUUID;

export const createBaseForgottenPasswordLinkAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Authentication<D>, D>,
	provider: ForgottenPasswordLinkProvider,
	assertPasswordStrength?: (password?: string) => boolean
) => {
	@Resolver()
	abstract class BaseForgottenPasswordLinkAuthResolver {
		abstract getUser(username: string): Promise<UserProfile>;
		abstract getForgottenPasswordLink(
			token: string
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>>;
		abstract getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>[]>;
		abstract createForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<AuthenticationBaseEntity<ForgottenPasswordLinkData>>;
		abstract sendForgottenPasswordLink(
			url: URL,
			ForgottenPasswordLink: AuthenticationBaseEntity<ForgottenPasswordLinkData>
		): Promise<boolean>;
		assertPasswordStrength = assertPasswordStrength ?? defaultPasswordStrength;

		public async generateForgottenPasswordLink(username: string, ctx: AuthorizationContext) {
			// check that the user exists
			const user = await this.getUser(username);

			// if the user does not exist, silently fail
			if (!user?.id) {
				logger.warn(`User with username ${username} does not exist or is not active.`);
				return;
			}

			// Check if the user created X links in the last X period
			const { rate } = config;

			// which is greater than 24hrs from now
			const period = new Date(new Date().getTime() - ms(rate.period));
			const links = await this.getForgottenPasswordLinks(user.id, period);

			// Check rate limiting conditions for forgotten password link creation
			if (links.length >= rate.limit) {
				logger.warn(`Too many forgotten password links created for ${username}.`);
				return;
			}

			// Create a forgotten password link and save it to the database
			const link = await this.createForgottenPasswordLink(user.id, createToken());

			// Get Redirect URL
			const redirect = new URL(
				ctx?.redirectUri?.toString() ?? requireEnvironmentVariable('AUTH_BASE_URI')
			);

			const url = new URL(`${redirect.origin}/auth/reset-password`);
			url.searchParams.set('redirect_uri', redirect.origin.toString());
			url.searchParams.set('token', link.data.token);

			return { link, url };
		}

		@Mutation((returns) => Boolean)
		async sendResetPasswordLink(
			@Arg('username', () => String) username: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<boolean> {
			const { url, link } = (await this.generateForgottenPasswordLink(username, ctx)) ?? {};

			// fail silently
			if (!link || !url) {
				logger.warn(`Failed to create Forgotten Password Link for user with username ${username}.`);
				return true;
			}

			// Send the link
			await this.sendForgottenPasswordLink(url, link);

			return true;
		}

		@Mutation((returns) => Boolean)
		async resetPassword(
			@Arg('token', () => String) token: string,
			@Arg('password', () => String) password: string
		): Promise<boolean> {
			const link = await this.getForgottenPasswordLink(token);

			if (!link) {
				logger.warn(`Failed to reset password: E0001: Link not found`);
				throw new AuthenticationError('Reset Password Failed');
			}

			if (link.data.redeemedAt !== 'null') {
				logger.warn(`Failed to reset password: E0002: Link already redeemed`);
				throw new AuthenticationError('Reset Password Failed');
			}

			if (link.createdAt < new Date(new Date().getTime() - ms(config.ttl))) {
				logger.warn(`Failed to reset password: E0003: Link expired`);
				throw new AuthenticationError('Reset Password Failed');
			}

			// Get the user's credential
			const credentialProvider = graphweaverMetadata.getEntity('Credential')?.provider;

			// Update the user's password
			await updatePasswordCredential({
				assertPasswordStrength: this.assertPasswordStrength,
				provider: credentialProvider,
				id: link.userId,
				password,
			});

			// redeem the link's token
			await provider.updateOne(link.id, {
				data: {
					...link.data,
					redeemedAt: new Date(),
				},
			});

			return true;
		}
	}
	return BaseForgottenPasswordLinkAuthResolver;
};
