import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';

import { AuthenticationMethod, AuthorizationContext, JwtPayload } from '../../types';
import { Token } from '../entities/token';
import { UserProfile } from '../../user-profile';
import { AuthTokenProvider } from '../token';
import { requireEnvironmentVariable } from '../../helper-functions';
import { BackendProvider, ResolverOptions, graphweaverMetadata } from '@exogee/graphweaver';
import { AuthenticationType } from '../../types';
import { AuthenticationBaseEntity } from '../entities';

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_MAGIC_LINK_RATE_LIMIT ?? '5'),
		period: process.env.AUTH_MAGIC_LINK_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_MAGIC_LINK_TTL || '15m',
};

export interface MagicLinkData {
	token: string;
	redeemedAt?: Date | 'null';
}

export interface MagicLinkEntity {
	id: string;
	userId: string;
	createdAt: Date;
	data: MagicLinkData;
}

type MagicLinkProvider = BackendProvider<AuthenticationBaseEntity<MagicLinkData>>;

export interface MagicLinkOptions {
	provider: MagicLinkProvider;
	getUser: (username: string) => Promise<UserProfile<unknown>>;
	sendMagicLink: (url: URL, magicLink: MagicLinkEntity) => Promise<boolean>;
}

// For now this is just a uuid
const createToken = randomUUID;

export class MagicLink {
	private provider: MagicLinkProvider;
	private getUser: (username: string) => Promise<UserProfile<unknown>>;
	private sendMagicLink: (url: URL, magicLink: MagicLinkEntity) => Promise<boolean>;

	constructor({ provider, getUser, sendMagicLink }: MagicLinkOptions) {
		this.getUser = getUser;
		this.sendMagicLink = sendMagicLink;
		this.provider = provider;

		graphweaverMetadata.addMutation({
			name: 'sendLoginMagicLink',
			args: {
				username: String,
			},
			getType: () => Boolean,
			resolver: this.sendLoginMagicLink.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'verifyLoginMagicLink',
			args: {
				username: String,
				token: String,
			},
			getType: () => Token,
			resolver: this.verifyLoginMagicLink.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'sendChallengeMagicLink',
			getType: () => Token,
			resolver: this.sendChallengeMagicLink.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'verifyChallengeMagicLink',
			getType: () => Token,
			args: {
				token: String,
			},
			resolver: this.verifyChallengeMagicLink.bind(this),
		});
	}

	async generateMagicLink(username: string, ctx: AuthorizationContext) {
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
		const links = await this.provider.find({
			type: AuthenticationType.MagicLinkChallenge,
			userId: user.id,
			createdAt_gt: period,
		} as {
			type: AuthenticationType.MagicLinkChallenge;
			userId: string;
			createdAt_gt: Date;
		});

		// Check rate limiting conditions for magic link creation
		if (links.length >= rate.limit) {
			logger.warn(`Too many magic links created for ${username}.`);
			return;
		}

		// Create a magic link and save it to the database
		const link = await this.provider.createOne({
			type: AuthenticationType.MagicLinkChallenge,
			userId: user.id,
			data: {
				token: createToken(),
				redeemedAt: 'null',
			},
		});

		// Get Redirect URL
		const redirect = new URL(
			ctx?.redirectUri?.toString() ?? requireEnvironmentVariable('AUTH_BASE_URI')
		);

		const url = new URL(redirect.origin);

		url.searchParams.set('redirect_uri', redirect.toString());
		url.searchParams.set('providers', AuthenticationMethod.MAGIC_LINK);
		url.searchParams.set('token', link.data.token);

		return { link, url };
	}

	async verifyMagicLink(username: string, magicLinkToken?: string, existingAuthToken?: JwtPayload) {
		try {
			if (!magicLinkToken)
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			const userProfile = await this.getUser(username);
			if (!userProfile?.id)
				throw new AuthenticationError('Auth unsuccessful: Authentication failed.');

			const link = await this.provider.findOne({
				type: AuthenticationType.MagicLinkChallenge,
				userId: userProfile.id,
				data: {
					token: magicLinkToken,
					redeemedAt: 'null',
				},
			});

			if (!link) throw new AuthenticationError('Authentication Failed: Link not found');

			// Check that the magic link is still valid
			const ttl = new Date(new Date().getTime() - ms(config.ttl));
			if (link.createdAt < ttl)
				throw new AuthenticationError('Auth unsuccessful: Authentication Magic Link expired.');

			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
			const authToken = existingAuthToken
				? await tokenProvider.stepUpToken(existingAuthToken)
				: await tokenProvider.generateToken(userProfile);

			// Mark the magic link as used
			await this.provider.updateOne(link.id, {
				data: {
					...link.data,
					redeemedAt: new Date(),
				},
			});

			return authToken;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Magic Link authentication failed.');
		}
	}

	async sendLoginMagicLink({
		args: { username },
		context,
	}: ResolverOptions<{ username: string }, AuthorizationContext>): Promise<boolean> {
		const { url, link } = (await this.generateMagicLink(username, context)) ?? {};

		// fail silently
		if (!link || !url) {
			logger.warn(`Failed to create Magic Link for user with username ${username}.`);
			return true;
		}

		url.pathname = 'auth/login';
		url.searchParams.set('username', username);

		return this.sendMagicLink(url, link);
	}

	async verifyLoginMagicLink({
		args: { username, token },
	}: ResolverOptions<{ username: string; token: string }>): Promise<Token> {
		return this.verifyMagicLink(username, token);
	}

	async sendChallengeMagicLink({
		context,
	}: ResolverOptions<unknown, AuthorizationContext>): Promise<boolean> {
		const username = context.user?.username;
		if (!username) throw new AuthenticationError('Challenge unsuccessful: Username missing.');

		const { url, link } = (await this.generateMagicLink(username, context)) ?? {};

		// fail silently
		if (!link || !url) {
			logger.warn(`Failed to create Magic Link for user with username ${username}.`);
			return true;
		}

		url.pathname = 'auth/challenge';

		// Send to user
		return this.sendMagicLink(url, link);
	}

	async verifyChallengeMagicLink({
		args: { token },
		context,
	}: ResolverOptions<{ token: string }, AuthorizationContext>): Promise<Token> {
		if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
		const tokenProvider = new AuthTokenProvider(AuthenticationMethod.MAGIC_LINK);
		const existingToken =
			typeof context.token === 'string'
				? await tokenProvider.decodeToken(context.token)
				: context.token;

		const username = context.user?.username;
		if (!username) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

		return this.verifyMagicLink(username, token, existingToken);
	}
}
