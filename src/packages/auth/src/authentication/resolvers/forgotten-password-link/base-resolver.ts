import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import { randomUUID } from 'crypto';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { AuthorizationContext } from '../../../types';
import { UserProfile } from '../../../user-profile';
import { requireEnvironmentVariable } from '../../../helper-functions';
import {
	BaseDataEntity,
	GraphqlEntityType,
	BackendProvider,
	EntityMetadataMap,
} from '@exogee/graphweaver';
import { Authentication, Credential as OrmCredential } from '../../entities';
import { defaultPasswordStrength } from '../password';
import { hashPassword } from '../../../utils/argon2id';

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

const createToken = randomUUID;

export const createBaseForgottenPasswordLinkAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Authentication<D>, D>,
	provider: BackendProvider<D, Authentication<D>>,
	assertPasswordStrength?: (password?: string) => boolean
) => {
	@Resolver()
	abstract class BaseForgottenPasswordLinkAuthResolver {
		abstract getUser(username: string): Promise<UserProfile>;
		abstract getForgottenPasswordLink(token: string): Promise<ForgottenPasswordLink>;
		abstract getForgottenPasswordLinks(
			userId: string,
			period: Date
		): Promise<ForgottenPasswordLink[]>;
		abstract createForgottenPasswordLink(
			userId: string,
			token: string
		): Promise<ForgottenPasswordLink>;
		abstract sendForgottenPasswordLink(
			url: URL,
			ForgottenPasswordLink: ForgottenPasswordLink
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
			// Current date minus the rate limit period

			// @todo - check this, getting period 2024-02-04T23:29:09.780Z
			// which is greater than 24hrs from now
			const period = new Date(new Date().getTime() - ms(rate.period));
			console.log('rate.period', rate.period);
			console.log('period', period);
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

			// @todo - Get the custom reset password component path here
			const url = new URL(`${redirect.origin}/auth/reset-password`);

			url.searchParams.set('redirect_uri', redirect.toString());
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
			if (!link) throw new AuthenticationError('Authentication Failed: Link not found');

			// These checks won't run they are in getForgottenPasswordLink
			if (link.data.redeemedAt !== 'null') {
				throw new AuthenticationError('Authentication Failed: Link already redeemed');
			}

			if (link.createdAt < new Date(new Date().getTime() - ms(config.ttl))) {
				throw new AuthenticationError('Authentication Failed: Link expired');
			}

			console.log('*******************\n');
			console.log('link', link);
			console.log('*******************\n');

			// Get the user
			const userProvider = EntityMetadataMap.get('User')?.provider as MikroBackendProvider<
				UserProfile,
				any
			>;

			const user = await userProvider.findOne({ id: link.userId });

			if (!user?.id) {
				throw new AuthenticationError('Authentication Failed: User not found');
			}

			// Get the user's credential

			const credentialProvider = EntityMetadataMap.get('Credential')
				?.provider as MikroBackendProvider<any, any>;
			//MikroBackendProvider<OrmCredential<any>, any>;

			const credential = await credentialProvider.findOne({
				username: user.username,
			});

			// Update the user's password
			console.log('*******************\n');
			console.log('credential', credential);
			console.log('*******************\n');

			this.assertPasswordStrength(password);
			const passwordHash = await hashPassword(password);

			// update the user's password
			const updatedCredential = await credentialProvider.updateOne(credential.id, {
				...credential,
				password: passwordHash,
			});

			console.log('*******************\n');
			console.log('updatedCredential', updatedCredential);
			console.log('*******************\n');

			// redeem the link's token
			const updatedLink = await provider.updateOne(link.id, {
				data: {
					...link.data,
					redeemedAt: new Date(),
				} as any,
			});

			console.log('*******************\n');
			console.log('updatedLink', updatedLink);
			console.log('*******************\n');
			return true;
		}
	}
	return BaseForgottenPasswordLinkAuthResolver;
};
