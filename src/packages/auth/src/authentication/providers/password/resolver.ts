import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { AuthorizationContext } from '../../../types';
import { PasswordAuthTokenProvider } from './provider';
import { Token } from '../../schema/token';
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
		const tokenProvider = new PasswordAuthTokenProvider();
		const userProfile = await this.authenticate(username, password);
		if (!userProfile) throw new Error('Login unsuccessful: Authentication failed.');

		const authToken = await tokenProvider.generateToken(userProfile);
		if (!authToken) throw new Error('Login unsuccessful: Token generation failed.');

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new Error('Login unsuccessful.');

		return token;
	}

	@Mutation(() => Token)
	async challengePassword(
		@Arg('password', () => String) password: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		if (!ctx.token) throw new Error('Challenge unsuccessful: Token missing.');
		const tokenProvider = new PasswordAuthTokenProvider();
		const existingToken =
			typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;

		const username = ctx.user?.username;
		if (!username) throw new Error('Challenge unsuccessful: Username missing.');

		const userProfile = await this.authenticate(username, password);
		if (!userProfile) throw new Error('Challenge unsuccessful: Userprofile missing.');

		const authToken = await tokenProvider.stepUpToken(existingToken);
		if (!authToken) throw new Error('Challenge unsuccessful: Step up failed.');

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new Error('Challenge unsuccessful.');

		return token;
	}
}
