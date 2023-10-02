import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import otpGenerator from 'otp-generator';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { Token } from '../../schema/token';
import { UserProfile } from '../../../user-profile';
import { AuthTokenProvider } from '../../token';

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_OTP_RATE_LIMIT ?? '10'),
		period: process.env.AUTH_OTP_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_OTP_TTL || '1m',
};

export interface OTP {
	id?: string;
	userId: string;
	code: string;
	createdAt: Date;
	redeemedAt?: Date;
}

const createCode = () =>
	otpGenerator.generate(6, {
		digits: true,
		lowerCaseAlphabets: false,
		upperCaseAlphabets: false,
		specialChars: false,
	});

@Resolver((of) => Token)
export abstract class OneTimePasswordAuthResolver {
	abstract getUser(username: string): Promise<UserProfile>;
	abstract getOTP(userId: string, code: string): Promise<OTP>;
	abstract getOTPs(userId: string, period: Date): Promise<OTP[]>;
	abstract createOTP(userId: string, code: string): Promise<OTP>;
	abstract redeemOTP(otp: OTP): Promise<boolean>;
	abstract sendOTP(otp: OTP): Promise<boolean>;

	@Mutation((returns) => Boolean)
	async sendOTPChallenge(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
		if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
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
		const otps = await this.getOTPs(user.id, period);

		// Check rate limiting conditions for otp creation
		if (otps.length >= rate.limit) {
			logger.warn(`Too many OTP created for ${username}.`);
			return true;
		}

		// Create a OTP and save it to the database
		const otp = await this.createOTP(user.id, createCode());
		// fail silently
		if (!otp) return true;

		// Send to user
		return this.sendOTP(otp);
	}

	@Mutation((returns) => Token)
	async verifyOTPChallenge(
		@Arg('code', () => String) code: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
		const tokenProvider = new AuthTokenProvider(AuthenticationMethod.ONE_TIME_PASSWORD);
		const existingAuthToken =
			typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

		const username = ctx.user?.username;
		if (!username) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

		try {
			if (!code) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			const userProfile = await this.getUser(username);
			if (!userProfile?.id)
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

			const otp = await this.getOTP(userProfile.id, code);
			// Check that the otp is still valid
			const ttl = new Date(new Date().getTime() - ms(config.ttl));
			if (otp.createdAt < ttl)
				throw new AuthenticationError('Challenge unsuccessful: Authentication OTP expired.');

			const authToken = await tokenProvider.stepUpToken(existingAuthToken);
			if (!authToken)
				throw new AuthenticationError('Challenge unsuccessful: Token generation failed.');

			const token = Token.fromBackendEntity(authToken);
			if (!token) throw new AuthenticationError('Challenge unsuccessful.');

			// Callback to the client to mark the otp as used
			await this.redeemOTP(otp);

			return token;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;

			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('OTP authentication failed.');
		}
	}
}
