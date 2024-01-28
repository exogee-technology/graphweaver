import {
	BackendProvider,
	BaseDataEntity,
	CreateOrUpdateHookParams,
	Filter,
	GraphqlEntityType,
	HookParams,
	HookRegister,
	Resolver,
	hookManagerMap,
} from '@exogee/graphweaver';

import { ApiKey, ApiKeyStorage } from '../../entities';
import { ApiKeyCreateOrUpdateInputArgs, createApiKeyBaseResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationError, ValidationError } from 'apollo-server-errors';
import { RequestParams } from '../../../types';
import { hashPassword, verifyPassword } from '../../../utils/argon2id';

export enum SecretOperation {
	LOGIN = 'login',
	REGISTER = 'register',
}

export const createApiKeyResolver = <D extends ApiKeyStorage>(
	gqlEntityType: GraphqlEntityType<ApiKey<D>, D>,
	provider: BackendProvider<D, ApiKey<D>>
) => {
	@Resolver()
	class PasswordAuthResolver extends createApiKeyBaseResolver(gqlEntityType, provider) {
		provider = provider;

		async getUserProfile(
			id: string,
			operation: SecretOperation,
			params: RequestParams
		): Promise<UserProfile> {
			// Use the operation type to decide what actions to perform
			// A register action could send an email verification for example
			throw new Error(
				'Method getUser not implemented for PasswordAuthResolver: Override this function to return a user profile'
			);
		}

		async authenticate(key: string, secret: string, params: RequestParams): Promise<ApiKeyStorage> {
			const apiKey = await this.provider.findOne({
				key,
			});

			if (!apiKey) throw new AuthenticationError('Bad Request: Authentication Failed. (E0001)');
			if (!apiKey.secret)
				throw new AuthenticationError('Bad Request: Authentication Failed. (E0002)');

			if (await verifyPassword(secret, apiKey.secret)) {
				return apiKey;
			}

			throw new AuthenticationError('Bad Request: Authentication Failed. (E0003)');
		}

		public async runAfterHooks<H extends HookParams<ApiKeyCreateOrUpdateInputArgs>>(
			hookRegister: HookRegister,
			hookParams: H,
			entities: (ApiKeyStorage | null)[]
		): Promise<(ApiKeyStorage | null)[]> {
			const hookManager = hookManagerMap.get('ApiKey');
			const { entities: hookEntities = [] } = hookManager
				? await hookManager.runHooks(hookRegister, {
						...hookParams,
						entities,
				  })
				: { entities };

			return hookEntities as (ApiKeyStorage | null)[];
		}

		async create(
			params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>
		): Promise<ApiKeyStorage> {
			const [item] = params.args.items;
			if (!item) throw new Error('No data specified cannot continue.');

			if (!item.key) throw new ValidationError('Create unsuccessful: Key not defined.');

			if (!item.secret) throw new ValidationError('Create unsuccessful: Secret not defined.');

			const secretHash = await hashPassword(item.secret);
			const apiKey = await this.provider.createOne({
				key: item.key,
				secret: secretHash,
			} as D);

			const [entity] = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [apiKey]);
			if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			return entity;
		}

		async update(
			params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>
		): Promise<ApiKeyStorage> {
			const [item] = params.args.items;
			if (!item.id) throw new ValidationError('Update unsuccessful: No ID sent in request.');

			if (!item.key && !item.key)
				throw new ValidationError('Update unsuccessful: Nothing to update.');

			const secretHash = item.secret ? await hashPassword(item.secret) : undefined;

			const apiKey = await this.provider.updateOne(item.id, {
				...(item.key ? { key: item.key } : {}),
				...(secretHash ? { secret: secretHash } : {}),
			});

			const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [apiKey]);
			if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			return apiKey;
		}
	}

	return PasswordAuthResolver;
};
