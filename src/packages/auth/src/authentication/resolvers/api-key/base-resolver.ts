import { Resolver, Mutation, Arg, Ctx, Info, InputType, Field, ID } from 'type-graphql';
import {
	BackendProvider,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	GraphqlEntityType,
	HookRegister,
	createBaseResolver,
	runWritableBeforeHooks,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-errors';

import { AuthorizationContext, RequestParams } from '../../../types';
import { GraphQLResolveInfo } from 'graphql';
import { ApiKey, ApiKeyStorage } from '../../entities';

@InputType(`ApiKeyInsertInput`)
class CreateApiKeyInputArgs {
	@Field(() => String)
	key!: string;

	@Field(() => String)
	secret!: string;
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

export const createApiKeyBaseResolver = (
	gqlEntityType: GraphqlEntityType<ApiKey<ApiKeyStorage>, ApiKeyStorage>,
	provider: BackendProvider<ApiKeyStorage, ApiKey<ApiKeyStorage>>
) => {
	const transactional = !!provider.withTransaction;

	@Resolver((of) => ApiKey)
	abstract class ApiKeyBaseResolver extends createBaseResolver(gqlEntityType, provider) {
		abstract create(
			params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>
		): Promise<ApiKeyStorage>;
		abstract update(
			params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>
		): Promise<ApiKeyStorage>;

		public async withTransaction<T>(callback: () => Promise<T>) {
			return provider.withTransaction ? provider.withTransaction<T>(callback) : callback();
		}

		@Mutation(() => ApiKey)
		async createApiKey(
			@Arg('data', () => CreateApiKeyInputArgs) data: CreateApiKeyInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<ApiKey<ApiKeyStorage> | null> {
			return this.withTransaction<ApiKey<ApiKeyStorage> | null>(async () => {
				const params = {
					args: { items: [data] },
					info,
					context,
					transactional,
				};

				const hookParams = await runWritableBeforeHooks<ApiKeyCreateOrUpdateInputArgs>(
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

				return ApiKey.fromBackendEntity<ApiKeyStorage, ApiKey<ApiKeyStorage>>(apiKey);
			});
		}

		@Mutation(() => ApiKey)
		async updateApiKey(
			@Arg('data', () => ApiKeyCreateOrUpdateInputArgs) data: ApiKeyCreateOrUpdateInputArgs,
			@Ctx() context: AuthorizationContext,
			@Info() info: GraphQLResolveInfo
		): Promise<ApiKey<ApiKeyStorage> | null> {
			return this.withTransaction<ApiKey<ApiKeyStorage> | null>(async () => {
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

				return ApiKey.fromBackendEntity<ApiKeyStorage, ApiKey<ApiKeyStorage>>(apiKey);
			});
		}
	}

	return ApiKeyBaseResolver;
};
