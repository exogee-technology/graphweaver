import { Resolver, Mutation, Arg, Ctx, Info, InputType, Field, ID } from 'type-graphql';
import {
	BackendProvider,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	GraphqlEntityType,
	HookRegister,
	createBaseResolver,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';

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
export class CredentialCreateOrUpdateInputArgs {
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
	const transactional = !!provider.withTransaction;

	@Resolver((of) => Token)
	abstract class BasePasswordAuthResolver extends createBaseResolver(gqlEntityType, provider) {
		abstract authenticate(
			username: string,
			password: string,
			params: RequestParams
		): Promise<UserProfile>;
		abstract create(
			params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
		): Promise<UserProfile>;
		abstract update(
			params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
		): Promise<UserProfile>;

		public async withTransaction<T>(callback: () => Promise<T>) {
			return provider.withTransaction ? provider.withTransaction<T>(callback) : callback();
		}

		async runWritableBeforeHooks(
			hookRegister: HookRegister,
			params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
		): Promise<CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>> {
			const hookManager = hookManagerMap.get('Credential');
			const hookParams = hookManager ? await hookManager.runHooks(hookRegister, params) : params;

			const items = hookParams.args?.items;
			if (!items) throw new Error('No data specified cannot continue.');
			return params;
		}

		@Mutation(() => Credential)
		async createCredential(
			@Arg('data', () => CreateCredentialInputArgs) data: CreateCredentialInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Credential<D> | null> {
			return this.withTransaction<Credential<D> | null>(async () => {
				const params = {
					args: { items: [data] },
					info,
					context,
					transactional,
				};

				const hookParams = await this.runWritableBeforeHooks(HookRegister.BEFORE_CREATE, params);

				let userProfile;
				try {
					userProfile = await this.create(hookParams);
				} catch (err) {
					if (err instanceof ForbiddenError)
						throw new ForbiddenError(
							'Permission Denied: You do not have permission to create credentials.'
						);
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
				} as { id: string; username: string } & BaseDataEntity) as Credential<D> | null;
			});
		}

		@Mutation(() => Credential)
		async updateCredential(
			@Arg('data', () => CredentialCreateOrUpdateInputArgs) data: CredentialCreateOrUpdateInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<Credential<D> | null> {
			return this.withTransaction<Credential<D> | null>(async () => {
				const params = {
					args: { items: [data] },
					info,
					context,
					transactional,
				};

				const hookParams = await this.runWritableBeforeHooks(HookRegister.BEFORE_UPDATE, params);

				let userProfile;
				try {
					userProfile = await this.update(hookParams);
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
				} as { id: string; username: string } & BaseDataEntity) as Credential<D> | null;
			});
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
