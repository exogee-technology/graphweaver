import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { AuthorizationContext } from '../../../types';
import { LocalAuthProvider } from './provider';
import { Token } from '../../schema/token';

@Resolver()
export class LocalAuthResolver {
	private authProvider: LocalAuthProvider;

	constructor(authProvider: LocalAuthProvider) {
		this.authProvider = authProvider;
	}

	@Mutation(() => Token)
	async login(
		@Arg('email') email: string,
		@Arg('password') password: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		const userProfile = await this.authProvider.login(email, password);
		const authToken = await this.authProvider.generateAuthToken(userProfile);

		const token = Token.fromBackendEntity(authToken);
		if (!token) throw new Error('Login unsuccessful.');

		return token;
	}

	@Mutation(() => Boolean)
	logout(@Ctx() ctx: AuthorizationContext): boolean {
		return true;
	}

	@Mutation(() => Token)
	async refreshSession(
		@Arg('refreshToken') refreshToken: string,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		const authToken = await this.authProvider.refreshAuthToken(refreshToken);
		const token = Token.fromBackendEntity(authToken);

		if (!token) throw new Error('Auth Token not refreshed.');

		return token;
	}
}
