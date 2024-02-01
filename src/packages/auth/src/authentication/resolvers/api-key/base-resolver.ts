import { Resolver, Mutation, Arg, Ctx, Info, InputType, Field, ID } from 'type-graphql';
import {
	BackendProvider,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	GraphqlEntityType,
	HookRegister,
	WithId,
	createBaseResolver,
	runWritableBeforeHooks,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-errors';
import { GraphQLResolveInfo } from 'graphql';

import { AuthorizationContext } from '../../../types';

@InputType(`ApiKeyInsertInput`)
export class ApiKeyInputArgs {
	@Field(() => String)
	key!: string;

	@Field(() => String)
	secret!: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: string[];
}

@InputType(`ApiKeyCreateOrUpdateInput`)
export class ApiKeyCreateOrUpdateInputArgs {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	key?: string;

	@Field(() => String, { nullable: true })
	secret?: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: string[];
}

export const createApiKeyBaseResolver = <G extends WithId, D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<G, D>,
	provider: BackendProvider<D, G>
) => {
	const transactional = !!provider.withTransaction;

	@Resolver()
	abstract class ApiKeyBaseResolver extends createBaseResolver(gqlEntityType, provider) {
		abstract create(params: CreateOrUpdateHookParams<ApiKeyInputArgs>): Promise<D>;
		abstract update(params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>): Promise<D>;

		public async withTransaction<T>(callback: () => Promise<T>) {
			return provider.withTransaction ? provider.withTransaction<T>(callback) : callback();
		}

		@Mutation(() => gqlEntityType)
		async createApiKey(
			@Arg('data', () => ApiKeyInputArgs) data: ApiKeyInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<G | null> {
			return this.withTransaction(async () => {
				const params = {
					args: { items: [data] },
					info,
					context,
					transactional,
				};

				const hookParams = await runWritableBeforeHooks<ApiKeyInputArgs>(
					HookRegister.BEFORE_CREATE,
					params,
					'ApiKey'
				);

				let apiKey;
				try {
					apiKey = await this.create(hookParams);
				} catch (err) {
					logger.error(err);
					if (err instanceof ValidationError) throw err;
					if (err instanceof ForbiddenError)
						throw new ForbiddenError(
							'Permission Denied: You do not have permission to create API keys.'
						);

					throw new AuthenticationError(
						'Create unsuccessful: You do not have permission to perform this action.'
					);
				}

				if (gqlEntityType.fromBackendEntity) {
					return gqlEntityType.fromBackendEntity(apiKey);
				}

				return apiKey as any;
			});
		}

		@Mutation(() => gqlEntityType)
		async updateApiKey(
			@Arg('data', () => ApiKeyCreateOrUpdateInputArgs) data: ApiKeyCreateOrUpdateInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<G | null> {
			return this.withTransaction(async () => {
				const params = {
					args: { items: [data] },
					info,
					context,
					transactional,
				};

				let apiKey;
				try {
					const hookParams = await runWritableBeforeHooks<ApiKeyCreateOrUpdateInputArgs>(
						HookRegister.BEFORE_UPDATE,
						params,
						'ApiKey'
					);
					apiKey = await this.update(hookParams);
				} catch (err) {
					logger.error(err);
					if (err instanceof ValidationError) throw err;
					if (err instanceof ForbiddenError)
						throw new ForbiddenError(
							'Permission Denied: You do not have permission to update an API key.'
						);
					throw new AuthenticationError(
						`Update unsuccessful: You do not have permission to perform this action.`
					);
				}

				if (gqlEntityType.fromBackendEntity) {
					return gqlEntityType.fromBackendEntity(apiKey);
				}

				return apiKey as any;
			});
		}
	}

	return ApiKeyBaseResolver;
};
