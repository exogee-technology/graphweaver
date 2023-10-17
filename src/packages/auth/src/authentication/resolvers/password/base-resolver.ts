import { Resolver, Mutation, Arg, Ctx, Info } from 'type-graphql';
import { AuthenticationError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthorizationContext, RequestParams } from '../../../types';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../../token';
import { Token } from '../../entities/token';
import { UserProfile } from '../../../user-profile';
import { GraphQLResolveInfo } from 'graphql';

export const createBasePasswordAuthResolver = () => {
	@Resolver((of) => Token)
	abstract class BasePasswordAuthResolver {
		abstract authenticate(
			username: string,
			password: string,
			params: RequestParams
		): Promise<UserProfile>;
		abstract save(username: string, password: string, params: RequestParams): Promise<UserProfile>;

		@Mutation(() => Token)
		async createLoginPassword(
			@Arg('username', () => String) username: string,
			@Arg('password', () => String) password: string,
			@Arg('confirm', () => String) confirm: string,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Token> {
			if (password !== confirm)
				throw new AuthenticationError('Login unsuccessful: Passwords do not match.');

			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSWORD);
			const userProfile = await this.save(username, password, { ctx, info });
			if (!userProfile) throw new AuthenticationError('Login unsuccessful: Authentication failed.');

			const authToken = await tokenProvider.generateToken(userProfile);
			return verifyAndCreateTokenFromAuthToken(authToken);
		}

		@Mutation(() => Token)
		async loginPassword(
			@Arg('username', () => String) username: string,
			@Arg('password', () => String) password: string,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Token> {
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSWORD);
			const userProfile = await this.authenticate(username, password, { ctx, info });
			if (!userProfile) throw new AuthenticationError('Login unsuccessful: Authentication failed.');

			const authToken = await tokenProvider.generateToken(userProfile);
			return verifyAndCreateTokenFromAuthToken(authToken);
		}

		@Mutation(() => Token)
		async challengePassword(
			@Arg('password', () => String) password: string,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Token> {
			if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSWORD);
			const existingToken =
				typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

			const username = ctx.user?.username;
			if (!username) throw new AuthenticationError('Challenge unsuccessful: Username missing.');

			const userProfile = await this.authenticate(username, password, { ctx, info });
			if (!userProfile)
				throw new AuthenticationError('Challenge unsuccessful: Userprofile missing.');

			const authToken = await tokenProvider.stepUpToken(existingToken);
			return verifyAndCreateTokenFromAuthToken(authToken);
		}
	}

	return BasePasswordAuthResolver;
};
