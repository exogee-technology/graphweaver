import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';

import { AuthenticationMethod, AuthorizationContext, JwtPayload } from '../../../types';
import { Token } from '../../entities/token';
import { UserProfile } from '../../../user-profile';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../../token';
import { requireEnvironmentVariable } from '../../../helper-functions';
import { BaseDataEntity, GraphqlEntityType, BackendProvider } from '@exogee/graphweaver';
import { Authentication, Credential } from '../../entities';

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

export interface ForgottenPasswordLink {
	id: string;
	userId: string;
	createdAt: Date;
	data: ForgottenPasswordLinkData;
}

// For now this is just a uuid
const createToken = randomUUID;

export const createBaseForgottenPasswordLinkAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Authentication<D>, D>,
	provider: BackendProvider<D, Authentication<D>>
) => {
	@Resolver()
	abstract class BaseForgottenPasswordLinkAuthResolver {
		abstract getUser(username: string): Promise<UserProfile>;
		// abstract getForgottenPasswordLink(
		// 	userId: string,
		// 	token: string
		// ): Promise<ForgottenPasswordLink>;
		abstract getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<ForgottenPasswordLink[]>;
		abstract createForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<ForgottenPasswordLink>;
		// abstract redeemForgottenPasswordLink(
		// 	ForgottenPasswordLink: ForgottenPasswordLink
		// ): Promise<boolean>;
		abstract sendForgottenPasswordLink(
			url: URL,
			ForgottenPasswordLink: ForgottenPasswordLink
		): Promise<boolean>;

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
			// Current date minus the rate limit period
			const period = new Date(new Date().getTime() - ms(rate.period));
			const links = await this.getForgottenPasswordLinks(user.id, period);

			// Check rate limiting conditions for magic link creation
			if (links.length >= rate.limit) {
				logger.warn(`Too many magic links created for ${username}.`);
				return;
			}

			// Create a magic link and save it to the database
			const link = await this.createForgottenPasswordLink(user.id, createToken());

			// Get Redirect URL
			const redirect = new URL(
				ctx?.redirectUri?.toString() ?? requireEnvironmentVariable('AUTH_BASE_URI')
			);

			const url = new URL(redirect.origin);

			url.searchParams.set('redirect_uri', redirect.toString());
			url.searchParams.set('providers', AuthenticationMethod.FORGOTTEN_PASSWORD_LINK); // What is this?
			url.searchParams.set('token', link.data.token);

			return { link, url };
		}

		@Mutation((returns) => Boolean)
		async sendForgottenPasswordLinky(
			@Arg('username', () => String) username: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<boolean> {
			const { url, link } = (await this.generateForgottenPasswordLink(username, ctx)) ?? {};

			// fail silently
			if (!link || !url) {
				logger.warn(`Failed to create Forgotten Password Link for user with username ${username}.`);
				return true;
			}

			return true;

			// url.pathname = 'auth/login';
			// url.searchParams.set('username', username);

			// return await this.sendForgottenPasswordLink(url, link);
		}
	}
	return BaseForgottenPasswordLinkAuthResolver;
};
