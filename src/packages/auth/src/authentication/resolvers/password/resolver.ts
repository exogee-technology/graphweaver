import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { AuthenticationError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { AuthTokenProvider } from '../../token';
import { Token } from '../../entities/token';
import { UserProfile } from '../../../user-profile';

@Resolver((of) => Token)
export abstract class PasswordAuthResolver {
	abstract authenticate(username: string, password: string): Promise<UserProfile>;

	@Mutation(() => Token)
	async loginPassword(
		@Arg('username', () => String) username: string,
		@Arg('password', () => String) password: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSWORD);
		const userProfile = await this.authenticate(username, password);
		if (!userProfile) throw new AuthenticationError('Login unsuccessful: Authentication failed.');

		const authToken = await tokenProvider.generateToken(userProfile);
		if (!authToken) throw new AuthenticationError('Login unsuccessful: Token generation failed.');

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new AuthenticationError('Login unsuccessful.');

		return token;
	}

	@Mutation(() => Token)
	async challengePassword(
		@Arg('password', () => String) password: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');
		const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSWORD);
		const existingToken =
			typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

		const username = ctx.user?.username;
		if (!username) throw new AuthenticationError('Challenge unsuccessful: Username missing.');

		const userProfile = await this.authenticate(username, password);
		if (!userProfile) throw new AuthenticationError('Challenge unsuccessful: Userprofile missing.');

		const authToken = await tokenProvider.stepUpToken(existingToken);
		if (!authToken) throw new AuthenticationError('Challenge unsuccessful: Step up failed.');

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new AuthenticationError('Challenge unsuccessful.');

		return token;
	}
}
