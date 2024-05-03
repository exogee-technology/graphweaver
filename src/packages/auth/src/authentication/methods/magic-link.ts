import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';

import { AuthenticationMethod, AuthorizationContext, JwtPayload } from '../../types';
import { Token } from '../entities/token';
import { UserProfile } from '../../user-profile';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../token';
import { requireEnvironmentVariable } from '../../helper-functions';
import { BackendProvider, graphweaverMetadata } from '@exogee/graphweaver';
import { GraphQLResolveInfo, Source } from 'graphql';
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

type MagicLinkProvider = BackendProvider<
	AuthenticationBaseEntity<MagicLinkData>,
	AuthenticationBaseEntity<MagicLinkData>
>;

export interface MagicLinkOptions {
	provider: MagicLinkProvider;
	getUser: (username: string) => Promise<UserProfile>;
	sendMagicLink: (url: URL, magicLink: MagicLinkEntity) => Promise<boolean>;
}

// For now this is just a uuid
const createToken = randomUUID;

export class MagicLink {
	private provider: MagicLinkProvider;
	private getUser: (username: string) => Promise<UserProfile>;
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

	/**
	 * Return a specific token for this user
	 * @param userId users ID
	 * @param token token string
	 * @returns Array of MagicLink compatible entities
	 */
	async getMagicLink(userId: string, token: string): Promise<MagicLinkEntity> {
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
	async getMagicLinks(userId: string, period: Date): Promise<MagicLinkEntity[]> {
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
	async createMagicLink(userId: string, token: string): Promise<MagicLinkEntity> {
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
	async redeemMagicLink({ id }: MagicLinkEntity): Promise<boolean> {
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
		const links = await this.getMagicLinks(user.id, period);

		// Check rate limiting conditions for magic link creation
		if (links.length >= rate.limit) {
			logger.warn(`Too many magic links created for ${username}.`);
			return;
		}

		// Create a magic link and save it to the database
		const link = await this.createMagicLink(user.id, createToken());

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

			const link = await this.getMagicLink(userProfile.id, magicLinkToken);
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
			await this.redeemMagicLink(link);

			return token;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Magic Link authentication failed.');
		}
	}

	async sendLoginMagicLink(
		_source: Source,
		{ username }: { username: string },
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<boolean> {
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

	async verifyLoginMagicLink(
		_source: Source,
		{ username, token }: { username: string; token: string },
		_context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<Token> {
		return this.verifyMagicLink(username, token);
	}

	async sendChallengeMagicLink(
		_source: Source,
		_args: Record<string, never>,
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<boolean> {
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

	async verifyChallengeMagicLink(
		_source: Source,
		{ token }: { token: string },
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<Token> {
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
