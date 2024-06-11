import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import Web3Token from 'web3-token';

import {
	AccessType,
	AuthenticationMethod,
	AuthenticationType,
	AuthorizationContext,
	MultiFactorAuthentication,
} from '../../types';
import { Token, AuthenticationBaseEntity } from '../entities';
import { AuthTokenProvider } from '../token';
import { checkAuthentication } from '../../helper-functions';
import { ChallengeError } from '../../errors';
import { BackendProvider, ResolverOptions, graphweaverMetadata } from '@exogee/graphweaver';

export type WalletAddress = {
	address: string;
};

type Web3AuthProvider = BackendProvider<AuthenticationBaseEntity<WalletAddress>>;

export class Web3 {
	private provider: Web3AuthProvider;
	private multiFactorAuthentication: () => Promise<MultiFactorAuthentication>;

	constructor({
		provider,
		multiFactorAuthentication,
	}: {
		provider: Web3AuthProvider;
		multiFactorAuthentication: () => Promise<MultiFactorAuthentication>;
	}) {
		this.provider = provider;

		if (multiFactorAuthentication) {
			this.multiFactorAuthentication = multiFactorAuthentication;
		} else {
			// Set a default MFA rule
			this.multiFactorAuthentication = async () => ({
				Everyone: {
					// all users must provide a OTP mfa when saving a wallet address
					Write: [{ factorsRequired: 1, providers: [AuthenticationMethod.PASSWORD] }],
				},
			});
		}

		graphweaverMetadata.addQuery({
			name: 'canEnrolWallet',
			getType: () => Boolean,
			resolver: this.canEnrolWallet.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'enrolWallet',
			getType: () => Boolean,
			args: {
				token: () => String,
			},
			resolver: this.enrolWallet.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'verifyWeb3Challenge',
			getType: () => Token,
			args: {
				token: () => String,
			},
			resolver: this.verifyWeb3Challenge.bind(this),
		});
	}

	/**
	 * Retrieve the user profile that matches the logged in user and wallet address
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a UserProfile compatible entity
	 */
	async getWalletAddress(
		userId: string,
		address: string
	): Promise<AuthenticationBaseEntity<WalletAddress>> {
		const device = await this.provider.findOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		if (!device) throw new Error('Bad Request: Unknown user wallet address provided.');

		return device;
	}

	/**
	 * Save the wallet address and associate with this user
	 * @param userId of the current logged in user
	 * @param address web3 address used to sign the mfa message
	 * @returns return a boolean if successful
	 */
	async saveWalletAddress(userId: string, address: string): Promise<boolean> {
		// Let's check if we already have this combination in the database
		const existingDevice = await this.provider.findOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		// It is found so no need to add it again
		if (existingDevice) return true;

		// Insert the new wallet address into the database
		await this.provider.createOne({
			type: AuthenticationType.Web3WalletAddress,
			userId,
			data: {
				address,
			},
		});

		return true;
	}

	// Use this query to check if you can enrol a wallet
	async canEnrolWallet({
		context,
	}: ResolverOptions<unknown, AuthorizationContext>): Promise<boolean> {
		try {
			if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			if (!context.user?.id)
				throw new AuthenticationError('Challenge unsuccessful: User not found.');

			const mfa = await this.multiFactorAuthentication();
			if (mfa) await checkAuthentication(mfa, AccessType.Create, context.token);

			return true;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Web3 authentication failed.');
		}
	}

	async enrolWallet({
		args: { token },
		context,
	}: ResolverOptions<{ token: string }, AuthorizationContext>): Promise<boolean> {
		try {
			if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			if (!context.user?.id)
				throw new AuthenticationError('Challenge unsuccessful: User not found.');
			if (!token) throw new AuthenticationError('Challenge unsuccessful: No web3 token.');

			const mfa = await this.multiFactorAuthentication();
			if (mfa) await checkAuthentication(mfa, AccessType.Create, context.token);

			const { address } = await Web3Token.verify(token);

			return this.saveWalletAddress(context.user.id, address);
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Web3 authentication failed.');
		}
	}

	async verifyWeb3Challenge({
		args: { token },
		context,
	}: ResolverOptions<{ token: string }, AuthorizationContext>): Promise<Token> {
		try {
			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
			if (!token) throw new AuthenticationError('Challenge unsuccessful: No web3 token.');
			if (!context.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');

			// Verify wallet address belongs to the logged in user
			const { address } = await Web3Token.verify(token);
			const walletAddress = await this.getWalletAddress(userId, address);

			// Double check the wallet address is for the current user
			if (userId !== walletAddress.userId) {
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
			}

			// Upgrade Token
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.WEB3);
			const existingAuthToken =
				typeof context.token === 'string'
					? await tokenProvider.decodeToken(context.token)
					: context.token;
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);

			return authToken;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Web3 authentication failed.');
		}
	}
}
