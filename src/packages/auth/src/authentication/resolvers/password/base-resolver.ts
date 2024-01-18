import { Resolver, Mutation, Arg, Ctx, Info, InputType, Field, ID } from 'type-graphql';
import {
	BackendProvider,
	BaseDataEntity,
	GraphqlEntityType,
	createBaseResolver,
} from '@exogee/graphweaver';
import { AuthenticationError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthorizationContext, RequestParams } from '../../../types';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../../token';
import { Token } from '../../entities/token';
import { UserProfile } from '../../../user-profile';
import { GraphQLResolveInfo } from 'graphql';
import { Credential } from '../../entities';

@InputType(`CredentialInsertInput`)
class CreateCredentialInputArgs {
	@Field(() => String)
	username!: string;

	@Field(() => String)
	password!: string;

	@Field(() => String)
	confirm!: string;
}

@InputType(`CredentialCreateOrUpdateInput`)
class CredentialCreateOrUpdateInputArgs {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	username?: string;

	@Field(() => String, { nullable: true })
	password?: string;

	@Field(() => String, { nullable: true })
	confirm?: string;
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
		abstract create(
			username: string,
			password: string,
			params: RequestParams
		): Promise<UserProfile>;
		abstract update(
			id: string,
			data: {
				username?: string;
				password?: string;
			},
			params: RequestParams
		): Promise<UserProfile>;

		@Mutation(() => Credential)
		async createCredential(
			@Arg('data', () => CreateCredentialInputArgs) data: CreateCredentialInputArgs,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Credential<BaseDataEntity> | null> {
			if (data.password !== data.confirm)
				throw new AuthenticationError('Create unsuccessful: Passwords do not match.');

			let userProfile;
			try {
				userProfile = await this.create(data.username, data.password, { ctx, info });
			} catch (err) {
				console.log(err);
				throw new AuthenticationError('Create unsuccessful: Failed to save credential.');
			}

			if (!userProfile)
				throw new AuthenticationError('Create unsuccessful: Failed to get user profile.');
			if (!userProfile.id) throw new AuthenticationError('Create unsuccessful: ID missing.');
			if (!userProfile.username)
				throw new AuthenticationError('Create unsuccessful: Username missing.');

			return Credential.fromBackendEntity({
				id: userProfile.id,
				username: userProfile.username,
			} as { id: string; username: string } & BaseDataEntity) as Credential<BaseDataEntity> | null;
		}

		@Mutation(() => Credential)
		async updateCredential(
			@Arg('data', () => CredentialCreateOrUpdateInputArgs) data: CredentialCreateOrUpdateInputArgs,
			@Ctx() ctx: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Credential<BaseDataEntity> | null> {
			if (!data.id) throw new AuthenticationError('Update unsuccessful: No ID sent in request.');

			if (data.password && data.password !== data.confirm)
				throw new AuthenticationError('Update unsuccessful: Passwords do not match.');

			if (!data.username && !data.password)
				throw new AuthenticationError('Update unsuccessful: Nothing to update.');

			let userProfile;
			try {
				userProfile = await this.update(
					data.id,
					{
						...(data.username ? { username: data.username } : {}),
						...(data.password ? { password: data.password } : {}),
					},
					{ ctx, info }
				);
			} catch (err) {
				console.log(err);
				throw new AuthenticationError('Update unsuccessful: Failed to save credential.');
			}

			if (!userProfile)
				throw new AuthenticationError('Update unsuccessful: Failed to get user profile.');
			if (!userProfile.id) throw new AuthenticationError('Update unsuccessful: ID missing.');
			if (!userProfile.username)
				throw new AuthenticationError('Update unsuccessful: Username missing.');

			return Credential.fromBackendEntity({
				id: userProfile.id,
				username: userProfile.username,
			} as { id: string; username: string } & BaseDataEntity) as Credential<BaseDataEntity> | null;
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
