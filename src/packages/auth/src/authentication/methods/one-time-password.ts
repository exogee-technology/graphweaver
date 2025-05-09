import { BackendProvider, ResolverOptions, graphweaverMetadata } from '@exogee/graphweaver';
import otpGenerator from 'otp-generator';
import ms, { StringValue } from 'ms';
import { logger } from '@exogee/logger';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthenticationType, AuthorizationContext } from '../../types';
import { AuthenticationBaseEntity } from '../entities';
import { Token } from '../entities/token';
import { AuthTokenProvider } from '../token';
import { ChallengeError } from '../../errors';
import { BaseAuthMethod } from './base-auth-method';
import { handleLogOnDidResolveOperation } from './utils';

export interface OneTimePasswordData {
	code: string;
	redeemedAt?: Date | 'null';
}

export interface OneTimePasswordEntity {
	id?: string;
	userId: string;
	data: OneTimePasswordData;
	createdAt: Date;
}

type OneTimePasswordProvider = BackendProvider<AuthenticationBaseEntity<OneTimePasswordData>>;

export interface OneTimePasswordOptions {
	provider: OneTimePasswordProvider;
	sendOTP: (otp: OneTimePasswordEntity) => Promise<boolean>;
}

const config = {
	rate: {
		limit: parseInt(process.env.AUTH_OTP_RATE_LIMIT ?? '10'),
		period: process.env.AUTH_OTP_RATE_PERIOD || '1d',
	},
	ttl: process.env.AUTH_OTP_TTL || '1m',
};

const createCode = () =>
	otpGenerator.generate(6, {
		digits: true,
		lowerCaseAlphabets: false,
		upperCaseAlphabets: false,
		specialChars: false,
	});

export class OneTimePassword extends BaseAuthMethod {
	private provider: OneTimePasswordProvider;
	private sendOTP: (otp: OneTimePasswordEntity) => Promise<boolean>;

	constructor({ sendOTP, provider }: OneTimePasswordOptions) {
		super();
		this.provider = provider;
		this.sendOTP = sendOTP;

		graphweaverMetadata.addMutation({
			name: 'sendOTPChallenge',
			getType: () => Boolean,
			resolver: this.sendOTPChallenge.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'verifyOTPChallenge',
			args: {
				code: () => String,
			},
			getType: () => Token,
			resolver: this.verifyOTPChallenge.bind(this),
			logOnDidResolveOperation: handleLogOnDidResolveOperation(new Set(['code'])),
		});
	}

	/**
	 * Return a specific OTP for this user
	 * @param userId users ID
	 * @param code code string
	 * @returns Array of OTP compatible entities
	 */
	async getOTP(userId: string, code: string): Promise<OneTimePasswordEntity> {
		const otp = await this.provider.findOne({
			type: AuthenticationType.OneTimePasswordChallenge,
			userId,
			data: { code, redeemedAt: 'null' },
		});

		if (!otp) throw new AuthenticationError('Authentication Failed: OTP not found');
		return otp;
	}

	/**
	 * Return all otp that are valid in the current period for this user
	 * @param userId user ID to search for
	 * @param period the earliest date that is valid for this period
	 * @returns OTP compatible entity
	 */
	async getOTPs(userId: string, period: Date): Promise<OneTimePasswordEntity[]> {
		return this.provider.find({
			type: AuthenticationType.OneTimePasswordChallenge,
			userId,
			createdAt_gt: period,
		} as {
			type: AuthenticationType.OneTimePasswordChallenge;
			userId: string;
			createdAt_gt: Date;
		});
	}

	/**
	 * A callback to persist the OTP in the data source of choice
	 * @param userId user ID to search for
	 * @param code the code generated for this OTP
	 * @returns OTP compatible entity
	 */
	async createOTP(userId: string, code: string): Promise<OneTimePasswordEntity> {
		const link = await this.provider.createOne({
			type: AuthenticationType.OneTimePasswordChallenge,
			userId,
			data: {
				code,
				redeemedAt: 'null',
			},
		});
		return link;
	}

	/**
	 * A callback to persist the redeeming of an OTP
	 * @param otp the otp that was updated
	 * @returns boolean to indicate the successful saving of the redeem operation
	 */
	async redeemOTP({ id }: OneTimePasswordEntity): Promise<boolean> {
		if (!id) throw new AuthenticationError('Authentication Failed: OTP not found');

		const otp = await this.provider.findOne({
			id,
		});

		if (!otp) {
			throw new AuthenticationError('Authentication Failed: OTP not found');
		}

		await this.provider.updateOne(id, {
			data: {
				...otp.data,
				redeemedAt: new Date(),
			},
		});

		return true;
	}

	/**
	 * Generate and send an OTP to the user
	 * @param ctx the context to use for the OTP generation
	 * @returns a boolean to indicate that the code has been sent
	 */
	async sendOTPChallenge({
		context,
	}: ResolverOptions<unknown, AuthorizationContext>): Promise<boolean> {
		if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
		const userId = context.user?.id;
		if (!userId) throw new AuthenticationError('Challenge unsuccessful: User ID missing.');

		// Check if the user created X links in the last X period
		const { rate } = config;
		// Current date minus the rate limit period
		const period = new Date(new Date().getTime() - ms(rate.period as StringValue));
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

	/**
	 * Verify the OTP challenge and return a new token
	 * @param code the OTP code to verify
	 * @param ctx the context to use for the verification
	 * @returns a new token
	 */
	async verifyOTPChallenge({
		args: { code },
		context,
	}: ResolverOptions<{ code: string }, AuthorizationContext>): Promise<Token> {
		try {
			if (!code) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
			if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Challenge unsuccessful: User ID missing.');

			const otp = await this.getOTP(userId, code);
			// Check that the otp is still valid
			const ttl = new Date(new Date().getTime() - ms(config.ttl as StringValue));
			if (otp.createdAt < ttl)
				throw new AuthenticationError('Challenge unsuccessful: Authentication OTP expired.');

			// Step up existing token
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.ONE_TIME_PASSWORD);
			const existingAuthToken =
				typeof context.token === 'string'
					? await tokenProvider.decodeToken(context.token)
					: context.token;
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);

			// Callback to the client to mark the otp as used
			await this.redeemOTP(otp);

			return authToken;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('OTP authentication failed.');
		}
	}
}
