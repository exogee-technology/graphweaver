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

export const createBaseForgottenPasswordLinkAuthResolver = () => {
	@Resolver()
	abstract class BaseForgottenPasswordLinkAuthResolver {
		abstract getUser(username: string): Promise<UserProfile>;
		abstract getForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<ForgottenPasswordLink>;
		abstract getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<ForgottenPasswordLink[]>;
		abstract createForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<ForgottenPasswordLink>;
		abstract redeemForgottenPasswordLink(
			ForgottenPasswordLink: ForgottenPasswordLink
		): Promise<boolean>;
		abstract sendForgottenPasswordLink(
			url: URL,
			ForgottenPasswordLink: ForgottenPasswordLink
		): Promise<boolean>;

		async generateForgottenPasswordLink(username: string, ctx: AuthorizationContext) {
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

		async verifyForgottenPasswordLink(
			username: string,
			forgottenPasswordLinkToken?: string,
			existingAuthToken?: JwtPayload
		) {
			try {
				if (!forgottenPasswordLinkToken)
					throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

				const userProfile = await this.getUser(username);
				if (!userProfile?.id)
					throw new AuthenticationError('Auth unsuccessful: Authentication failed.');

				const link = await this.getForgottenPasswordLink(
					userProfile.id,
					forgottenPasswordLinkToken
				);
				// Check that the magic link is still valid
				const ttl = new Date(new Date().getTime() - ms(config.ttl));
				if (link.createdAt < ttl)
					throw new AuthenticationError('Auth unsuccessful: Authentication Magic Link expired.');

				const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
				const authToken = existingAuthToken
					? await tokenProvider.stepUpToken(existingAuthToken)
					: await tokenProvider.generateToken(userProfile);

				const token = verifyAndCreateTokenFromAuthToken(authToken);

				// Callback to the client to mark the magic link as used
				await this.redeemForgottenPasswordLink(link);

				return token;
			} catch (e) {
				if (e instanceof AuthenticationError) throw e;

				logger.error('Authentication failed with error', e);
				throw new AuthenticationError('Magic Link authentication failed.');
			}
		}

		@Mutation((returns) => Boolean)
		async sendLoginForgottenPasswordLink(
			@Arg('username', () => String) username: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<boolean> {
			const { url, link } = (await this.generateForgottenPasswordLink(username, ctx)) ?? {};

			// fail silently
			if (!link || !url) {
				logger.warn(`Failed to create Forgotten Password Link for user with username ${username}.`);
				return true;
			}

			url.pathname = 'auth/login';
			url.searchParams.set('username', username);

			return await this.sendForgottenPasswordLink(url, link);
		}

		@Mutation((returns) => Token)
		async verifyLoginForgottenPasswordLink(
			@Arg('username', () => String) username: string,
			@Arg('token', () => String) forgottenPasswordLinkToken: string
		): Promise<Token> {
			return this.verifyForgottenPasswordLink(username, forgottenPasswordLinkToken);
		}

		@Mutation((returns) => Boolean)
		async sendChallengeForgottenPasswordLink(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
			const username = ctx.user?.username;
			if (!username) throw new AuthenticationError('Challenge unsuccessful: Username missing.');

			const { url, link } = (await this.generateForgottenPasswordLink(username, ctx)) ?? {};

			// fail silently
			if (!link || !url) {
				logger.warn(`Failed to create Magic Link for user with username ${username}.`);
				return true;
			}

			url.pathname = 'auth/challenge';

			// Send to user
			return await this.sendForgottenPasswordLink(url, link);
		}

		@Mutation((returns) => Token)
		async verifyChallengeForgottenPasswordLink(
			@Arg('token', () => String) forgottenPasswordLinkToken: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<Token> {
			if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
			const existingToken =
				typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

			const username = ctx.user?.username;
			if (!username)
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			return this.verifyForgottenPasswordLink(username, forgottenPasswordLinkToken, existingToken);
		}
	}
	return BaseForgottenPasswordLinkAuthResolver;
};
