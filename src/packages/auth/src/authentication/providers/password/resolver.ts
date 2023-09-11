import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { AuthorizationContext } from '../../../types';
import { PasswordAuthTokenProvider } from './provider';
import { Token } from '../../schema/token';
import { UserProfile } from '../../../user-profile';

@Resolver((of) => Token)
export abstract class PasswordAuthResolver {
	abstract authenticate(username: string, password: string): Promise<UserProfile>;

	@Mutation(() => Token)
	async login(
		@Arg('username', () => String) username: string,
		@Arg('password', () => String) password: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		const tokenProvider = new PasswordAuthTokenProvider();
		const userProfile = await this.authenticate(username, password);
		if (!userProfile) throw new Error('Login unsuccessful.');

		const authToken = await tokenProvider.generateToken(userProfile);
		if (!authToken) throw new Error('Login unsuccessful.');

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new Error('Login unsuccessful.');

		return token;
	}
}
