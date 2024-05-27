import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';
import { BackendProvider, ResolverOptions, graphweaverMetadata } from '@exogee/graphweaver';
import { GraphQLResolveInfo, Source } from 'graphql';

import { AuthorizationContext, AuthenticationType } from '../../types';
import { UserProfile } from '../../user-profile';
import { requireEnvironmentVariable } from '../../helper-functions';
import { AuthenticationBaseEntity, CredentialStorage } from '../entities';
import { defaultPasswordStrength, updatePasswordCredential } from './utils';

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_FORGOTTEN_PASSWORD_LINK_RATE_LIMIT ?? '4'),
		period: process.env.AUTH_FORGOTTEN_PASSWORD_LINK_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_FORGOTTEN_PASSWORD_LINK_TTL || '15m',
};

type ForgottenPasswordLinkProvider = BackendProvider<
	AuthenticationBaseEntity<ForgottenPasswordLinkData>
>;

export interface ForgottenPasswordLinkData {
	token: string;
	redeemedAt?: Date | 'null';
}

const createToken = randomUUID;

export type ForgottenPasswordOptions = {
	provider: ForgottenPasswordLinkProvider;
	sendForgottenPasswordLink: (
		url: URL,
		forgottenPasswordLink: AuthenticationBaseEntity<ForgottenPasswordLinkData>
	) => Promise<boolean>;
	getUser: (username: string) => Promise<UserProfile<unknown>>;
	assertPasswordStrength?: (password?: string) => boolean;
};

export class ForgottenPassword {
	private provider: ForgottenPasswordLinkProvider;
	private assertPasswordStrength: (password?: string) => boolean;

	/**
	 * A callback that can be used to send the magic link via channels such as email or SMS
	 * @param forgottenPasswordLink the URL that was generated and should be sent to the user
	 * @returns a boolean to indicate that the URL has been sent
	 */
	private sendForgottenPasswordLink: (
		url: URL,
		forgottenPasswordLink: AuthenticationBaseEntity<ForgottenPasswordLinkData>
	) => Promise<boolean>;

	/**
	 *
	 * @param username fetch user details using a username
	 * @returns return a UserProfile compatible entity
	 */
	private getUser: (username: string) => Promise<UserProfile<unknown>>;

	constructor({
		provider,
		assertPasswordStrength,
		sendForgottenPasswordLink,
		getUser,
	}: ForgottenPasswordOptions) {
		this.provider = provider;
		this.sendForgottenPasswordLink = sendForgottenPasswordLink;
		this.getUser = getUser;
		this.assertPasswordStrength = assertPasswordStrength ?? defaultPasswordStrength;

		graphweaverMetadata.addMutation({
			name: 'sendResetPasswordLink',
			args: {
				username: String,
			},
			getType: () => Boolean,
			resolver: this.sendResetPasswordLink.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'resetPassword',
			args: {
				token: String,
				password: String,
			},
			getType: () => Boolean,
			resolver: this.resetPassword.bind(this),
		});
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

		const authPath = process.env.AUTH_PATH ?? '/auth';
		const resetPasswordPath = process.env.AUTH_RESET_PASSWORD_PATH ?? '/reset-password';

		const url = new URL(`${redirect.origin}${authPath}${resetPasswordPath}`);
		url.searchParams.set('redirect_uri', redirect.origin.toString());
		url.searchParams.set('token', link.data.token);

		return { link, url };
	}

	async sendResetPasswordLink({
		args: { username },
		context,
	}: ResolverOptions<{ username: string }, AuthorizationContext>): Promise<boolean> {
		const { url, link } = (await this.generateForgottenPasswordLink(username, context)) ?? {};

		// fail silently
		if (!link || !url) {
			logger.warn(`Failed to create Forgotten Password Link for user with username ${username}.`);
			return true;
		}

		// Send the link
		await this.sendForgottenPasswordLink(url, link);

		return true;
	}

	async resetPassword({
		args: { token, password },
	}: ResolverOptions<{ token: string; password: string }>): Promise<boolean> {
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
		const credentialProvider = graphweaverMetadata.getEntityByName<Credential, CredentialStorage>(
			'Credential'
		)?.provider;

		if (!credentialProvider) {
			throw new Error('Bad Request: No provider associated with the Credential entity.');
		}

		// Update the user's password
		await updatePasswordCredential({
			assertPasswordStrength: this.assertPasswordStrength,
			provider: credentialProvider,
			id: link.userId,
			password,
		});

		// redeem the link's token
		await this.provider.updateOne(link.id, {
			data: {
				...link.data,
				redeemedAt: new Date(),
			},
		});

		return true;
	}
}
