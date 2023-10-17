import { Resolver, Mutation, Arg, Ctx, Query } from 'type-graphql';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { logger } from '@exogee/logger';
import Web3Token from 'web3-token';

import {
	AccessType,
	AuthenticationMethod,
	AuthorizationContext,
	MultiFactorAuthentication,
} from '../../../types';
import { Token } from '../../entities/token';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../../token';
import { checkAuthentication } from '../../../helper-functions';
import { ChallengeError } from '../../../errors';
import { AuthenticationBaseEntity } from '../../entities';
import { WalletAddress } from './resolver';

export const createBaseWeb3AuthResolver = () => {
	@Resolver()
	abstract class BaseWeb3AuthResolver {
		abstract getMultiFactorAuthentication(): Promise<MultiFactorAuthentication | undefined>;
		abstract getWalletAddress(
			id: string,
			address: string
		): Promise<AuthenticationBaseEntity<WalletAddress>>;
		abstract saveWalletAddress(id: string, address: string): Promise<boolean>;

		// Use this query to check if you can enrol a wallet
		@Query((returns) => Boolean)
		async canEnrolWallet(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
			try {
				if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
				if (!ctx.user?.id) throw new AuthenticationError('Challenge unsuccessful: User not found.');

				const mfa = await this.getMultiFactorAuthentication();
				if (mfa) await checkAuthentication(mfa, AccessType.Create, ctx.token);

				return true;
			} catch (e) {
				if (e instanceof AuthenticationError) throw e;
				if (e instanceof ChallengeError) throw e;
				if (e instanceof ForbiddenError) throw e;

				logger.error('Authentication failed with error', e);
				throw new AuthenticationError('Web3 authentication failed.');
			}
		}

		@Mutation((returns) => Boolean)
		async enrolWallet(
			@Arg('token', () => String) token: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<boolean> {
			try {
				if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
				if (!ctx.user?.id) throw new AuthenticationError('Challenge unsuccessful: User not found.');
				if (!token) throw new AuthenticationError('Challenge unsuccessful: No web3 token.');

				const mfa = await this.getMultiFactorAuthentication();
				if (mfa) await checkAuthentication(mfa, AccessType.Create, ctx.token);

				const { address } = await Web3Token.verify(token);

				return this.saveWalletAddress(ctx.user.id, address);
			} catch (e) {
				if (e instanceof AuthenticationError) throw e;
				if (e instanceof ChallengeError) throw e;
				if (e instanceof ForbiddenError) throw e;

				logger.error('Authentication failed with error', e);
				throw new AuthenticationError('Web3 authentication failed.');
			}
		}

		@Mutation((returns) => Token)
		async verifyWeb3Challenge(
			@Arg('token', () => String) web3Token: string,
			@Ctx() ctx: AuthorizationContext
		): Promise<Token> {
			try {
				const userId = ctx.user?.id;
				if (!userId)
					throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
				if (!web3Token) throw new AuthenticationError('Challenge unsuccessful: No web3 token.');
				if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');

				// Verify wallet address belongs to the logged in user
				const { address } = await Web3Token.verify(web3Token);
				const walletAddress = await this.getWalletAddress(userId, address);

				// Double check the wallet address is for the current user
				if (userId !== walletAddress.userId) {
					throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
				}

				// Upgrade Token
				const tokenProvider = new AuthTokenProvider(AuthenticationMethod.WEB3);
				const existingAuthToken =
					typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;
				const authToken = await tokenProvider.stepUpToken(existingAuthToken);

				return verifyAndCreateTokenFromAuthToken(authToken);
			} catch (e) {
				if (e instanceof AuthenticationError) throw e;

				logger.error('Authentication failed with error', e);
				throw new AuthenticationError('Web3 authentication failed.');
			}
		}
	}

	return BaseWeb3AuthResolver;
};
