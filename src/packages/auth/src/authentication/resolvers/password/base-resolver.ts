import { Resolver, Mutation, Arg, Ctx, Info, InputType, Field } from 'type-graphql';
import {
	BackendProvider,
	BaseDataEntity,
	GraphqlEntityType,
	WithId,
	createBaseResolver,
} from '@exogee/graphweaver';
import { AuthenticationError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthorizationContext, RequestParams } from '../../../types';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../../token';
import { Token } from '../../entities/token';
import { UserProfile } from '../../../user-profile';
import { GraphQLResolveInfo } from 'graphql';
import { Credential, PasswordStorage } from '../../entities';

@InputType(`CredentialInsertInput`)
class CreateCredentialInputArgs {
	@Field(() => String)
	username!: string;

	@Field(() => String)
	password!: string;

	@Field(() => String)
	confirm!: string;
}

export const createBasePasswordAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Credential<D>, D>,
	provider: BackendProvider<D, Credential<D>>
) => {
	@Resolver((of) => Token)
	abstract class BasePasswordAuthResolver extends createBaseResolver(gqlEntityType, provider) {
		abstract authenticate(
			username: string,
			password: string,
			params: RequestParams
		): Promise<UserProfile>;
		abstract save(username: string, password: string, params: RequestParams): Promise<UserProfile>;

		@Mutation(() => Credential)
		async createCredential(
			@Arg('data', () => CreateCredentialInputArgs) data: CreateCredentialInputArgs,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Credential<BaseDataEntity> | null> {
			if (data.password !== data.confirm)
				throw new AuthenticationError('Login unsuccessful: Passwords do not match.');

			const userProfile = await this.save(data.username, data.password, { ctx, info });
			if (!userProfile) throw new AuthenticationError('Login unsuccessful: Authentication failed.');

			if (!userProfile.id) throw new AuthenticationError('Login unsuccessful: ID missing.');
			if (!userProfile.username)
				throw new AuthenticationError('Login unsuccessful: Username missing.');

			return Credential.fromBackendEntity({
				id: userProfile.id,
				username: userProfile.username,
			} as PasswordStorage & { isCollection: any; isReference: any });
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
