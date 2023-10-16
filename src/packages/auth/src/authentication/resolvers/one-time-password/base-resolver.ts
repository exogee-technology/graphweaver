import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import ms from 'ms';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import otpGenerator from 'otp-generator';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { Token } from '../../entities/token';
import { AuthTokenProvider } from '../../token';
import { ChallengeError } from '../../../errors';

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_OTP_RATE_LIMIT ?? '10'),
		period: process.env.AUTH_OTP_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_OTP_TTL || '1m',
};

export interface OneTimePasswordData {
	code: string;
	redeemedAt?: Date | 'null';
}

export interface OneTimePassword {
	id?: string;
	userId: string;
	data: OneTimePasswordData;
	createdAt: Date;
}

const createCode = () =>
	otpGenerator.generate(6, {
		digits: true,
		lowerCaseAlphabets: false,
		upperCaseAlphabets: false,
		specialChars: false,
	});

export const createBaseOneTimePasswordAuthResolver = () => {
	@Resolver()
	abstract class BaseOneTimePasswordAuthResolver {
		abstract getOTP(userId: string, code: string): Promise<OneTimePassword>;
		abstract getOTPs(userId: string, period: Date): Promise<OneTimePassword[]>;
		abstract createOTP(userId: string, code: string): Promise<OneTimePassword>;
		abstract redeemOTP(otp: OneTimePassword): Promise<boolean>;
		abstract sendOTP(otp: OneTimePassword): Promise<boolean>;

		@Mutation((returns) => Boolean)
		async sendOTPChallenge(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
			if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			const userId = ctx.user?.id;
			if (!userId) throw new AuthenticationError('Challenge unsuccessful: User ID missing.');

			// Check if the user created X links in the last X period
			const { rate } = config;
			// Current date minus the rate limit period
			const period = new Date(new Date().getTime() - ms(rate.period));
			const otps = await this.getOTPs(userId, period);

			// Check rate limiting conditions for otp creation
			if (otps.length >= rate.limit) {
				logger.warn(`Too many OTP created for user with ID: ${userId}.`);
				return true;
			}

			// Create a OTP and save it to the database
			const otp = await this.createOTP(userId, createCode());
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
			try {
				if (!code) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
				if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
				const userId = ctx.user?.id;
				if (!userId) throw new AuthenticationError('Challenge unsuccessful: User ID missing.');

				const otp = await this.getOTP(userId, code);
				// Check that the otp is still valid
				const ttl = new Date(new Date().getTime() - ms(config.ttl));
				if (otp.createdAt < ttl)
					throw new AuthenticationError('Challenge unsuccessful: Authentication OTP expired.');

				// Step up existing token
				const tokenProvider = new AuthTokenProvider(AuthenticationMethod.ONE_TIME_PASSWORD);
				const existingAuthToken =
					typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;
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
				if (e instanceof ChallengeError) throw e;
				if (e instanceof ForbiddenError) throw e;

				logger.error('Authentication failed with error', e);
				throw new AuthenticationError('OTP authentication failed.');
			}
		}
	}

	return BaseOneTimePasswordAuthResolver;
};
