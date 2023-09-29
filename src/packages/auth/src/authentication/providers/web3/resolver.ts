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
import { Token } from '../../schema/token';
import { UserProfile } from '../../../user-profile';
import { AuthTokenProvider } from '../../token';
import { checkAuthentication } from '../../../helper-functions';
import { ChallengeError } from '../../../errors';

@Resolver((of) => Token)
export abstract class Web3AuthResolver {
	abstract getMultiFactorAuthentication(): Promise<MultiFactorAuthentication>;
	abstract getUserByWalletAddress(id: string, address: string): Promise<UserProfile>;
	abstract saveWalletAddress(id: string, address: string): Promise<boolean>;

	// Use this query to check if you can enrol a wallet
	@Query((returns) => Boolean)
	async canEnrolWallet(@Ctx() ctx: AuthorizationContext): Promise<boolean> {
		try {
			if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			if (!ctx.user?.id) throw new AuthenticationError('Challenge unsuccessful: User not found.');

			const mfa = await this.getMultiFactorAuthentication();
			await checkAuthentication(mfa, AccessType.Create, ctx.token);

			return true;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.info('Authentication failed with error', e);
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
			await checkAuthentication(mfa, AccessType.Create, ctx.token);

			const { address } = await Web3Token.verify(token);

			return this.saveWalletAddress(ctx.user.id, address);
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Web3 authentication failed.');
		}
	}

	@Mutation((returns) => Token)
	async verifyWeb3Challenge(
		@Arg('token', () => String) web3Token: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
		const tokenProvider = new AuthTokenProvider(AuthenticationMethod.ONE_TIME_PASSWORD);
		const existingAuthToken =
			typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

		const userId = ctx.user?.id;
		if (!userId) throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');

		try {
			if (!web3Token) throw new AuthenticationError('Challenge unsuccessful: No web3 token.');

			const { address } = await Web3Token.verify(web3Token);
			const userByAddress = await this.getUserByWalletAddress(userId, address);

			// Double check the wallet address is for the current user
			if (userId !== userByAddress.id) {
				throw new AuthenticationError('Challenge unsuccessful: Authentication failed.');
			}

			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.WEB3);
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);
			if (!authToken)
				throw new AuthenticationError('Challenge unsuccessful: Token generation failed.');

			const token = Token.fromBackendEntity(authToken);
			if (!token) throw new AuthenticationError('Challenge unsuccessful.');

			return token;
		} catch (e) {
			if (e instanceof AuthenticationError) throw e;

			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Web3 authentication failed.');
		}
	}
}
