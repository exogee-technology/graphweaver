import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { Token } from '../../schema/token';
import { UserProfile } from '../../../user-profile';
import { AuthTokenProvider } from '../../token';
import { requireEnvironmentVariable } from '../../../helper-functions';

const config = {
	rate: {
		limit: parseInt(process.env.MAGIC_LINK_RATE_LIMIT ?? '5'),
		period: process.env.MAGIC_LINK_RATE_PERIOD || '1d',
	},
	ttl: process.env.MAGIC_LINK_TTL || '15m',
};

export interface MagicLink {
	userId: string;
	token: string;
	createdAt: Date;
	redeemedAt?: Date;
}

@Resolver((of) => Token)
export abstract class MagicLinkAuthResolver {
	abstract getUser(username: string): Promise<UserProfile>;
	abstract getMagicLink(userId: string, token: string): Promise<MagicLink>;
	abstract getMagicLinks(userId: string, period: Date): Promise<MagicLink[]>;
	abstract createMagicLink(userId: string, token: string): Promise<MagicLink>;
	abstract redeemMagicLink(magicLink: MagicLink): Promise<boolean>;
	abstract emailMagicLink(magicLink: URL): Promise<boolean>;

	@Mutation((returns) => Boolean)
	async sendMagicLink(
		@Arg('username', () => String) username: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<boolean> {
		// check that the user exists
		const user = await this.getUser(username);

		// if the user does not exist, silently fail
		if (!user?.id) {
			logger.warn(`User with username ${username} does not exist or is not active.`);
			return true;
		}

		// Check if the user created X links in the last X period
		const { rate } = config;
		// Current date minus the rate limit period
		const period = new Date(new Date().getTime() - ms(rate.period));
		const links = await this.getMagicLinks(user.id, period);

		// Check rate limiting conditions for magic link creation
		if (links.length >= rate.limit) {
			logger.warn(`Too many magic links created for ${username}.`);
			return true;
		}

		// Create a magic link and save it to the database
		const link = await this.createMagicLink(user.id, randomUUID());

		// Get Redirect URL
		const redirect = new URL(
			ctx?.redirectUri?.toString() ?? requireEnvironmentVariable('AUTH_BASE_URI')
		);
		const url = new URL(redirect.origin);
		url.pathname = 'auth/magic-link/verify';

		// Set search params
		url.searchParams.set('redirect_uri', redirect.toString());
		url.searchParams.set('token', link.token);
		url.searchParams.set('username', username);

		// Send to user
		return await this.emailMagicLink(url);
	}

	@Mutation((returns) => Token)
	async loginMagicLink(
		@Arg('username', () => String) username: string,
		@Arg('token', () => String) magicLinkToken: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!magicLinkToken)
			throw new AuthenticationError('Login unsuccessful: Authentication failed.');
		// Current date minus ttl
		const ttl = new Date(new Date().getTime() - ms(config.ttl));

		// find the magic link in the database
		try {
			const userProfile = await this.getUser(username);
			if (!userProfile?.id)
				throw new AuthenticationError('Login unsuccessful: Authentication failed.');

			const link = await this.getMagicLink(userProfile.id, magicLinkToken);
			// {
			// 	token,
			// 	createdAt: {
			// 		$gt: ttl,
			// 	},
			// },
			// @todo check the above criteria
			if (!link) throw new AuthenticationError('Login unsuccessful: Authentication failed.');

			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
			const authToken = await tokenProvider.generateToken(userProfile);
			if (!authToken) throw new AuthenticationError('Login unsuccessful: Token generation failed.');

			const token = Token.fromBackendEntity(authToken);
			if (!token) throw new AuthenticationError('Login unsuccessful.');

			// Callback to the client to mark the magic link as used
			await this.redeemMagicLink(link);

			return token;
		} catch (e) {
			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Authentication failed.');
		}
	}

	@Mutation((returns) => Boolean)
	async sendChallengeMagicLink(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
		const username = ctx.user?.username;
		if (!username) throw new AuthenticationError('Challenge unsuccessful: Username missing.');

		// check that the user exists
		const user = await this.getUser(username);

		// if the user does not exist, silently fail
		if (!user?.id) {
			logger.warn(`User with username ${username} does not exist or is not active.`);
			return true;
		}

		// Check if the user created X links in the last X period
		const { rate } = config;
		// Current date minus the rate limit period
		const period = new Date(new Date().getTime() - ms(rate.period));
		const links = await this.getMagicLinks(user.id, period);

		// Check rate limiting conditions for magic link creation
		if (links.length >= rate.limit) {
			logger.warn(`Too many magic links created for ${username}.`);
			return true;
		}

		// Create a magic link and save it to the database
		const link = await this.createMagicLink(user.id, randomUUID());

		// Get Redirect URL
		const redirect = new URL(
			ctx?.redirectUri?.toString() ?? requireEnvironmentVariable('AUTH_BASE_URI')
		);
		const url = new URL(redirect.origin);
		url.pathname = 'auth/magic-link/challenge';

		// Set search params
		url.searchParams.set('redirect_uri', redirect.toString());
		url.searchParams.set('token', link.token);

		// Send to user
		return await this.emailMagicLink(url);
	}

	@Mutation((returns) => Token)
	async verifyChallengeMagicLink(
		@Arg('token', () => String) magicLinkToken: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!magicLinkToken)
			throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
		// Current date minus ttl
		const ttl = new Date(new Date().getTime() - ms(config.ttl));

		// find the magic link in the database
		try {
			const username = ctx.user?.username;
			if (!username)
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			// check that the user exists
			const user = await this.getUser(username);

			// if the user does not exist, silently fail
			if (!user?.id) {
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
			}

			const link = await this.getMagicLink(user.id, magicLinkToken);
			// {
			// 	createdAt: {
			// 		$gt: ttl,
			// 	},
			// },
			// @todo check the above criteria
			if (!link) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
			const authToken = await tokenProvider.stepUpToken(user);
			if (!authToken)
				throw new AuthenticationError('Challenge unsuccessful: Token generation failed.');

			const token = Token.fromBackendEntity(authToken);
			if (!token) throw new AuthenticationError('Challenge unsuccessful.');

			// Callback to the client to mark the magic link as used
			await this.redeemMagicLink(link);

			return token;
		} catch (e) {
			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Authentication failed.');
		}
	}
}
