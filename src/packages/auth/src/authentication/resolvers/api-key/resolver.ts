import {
	BackendProvider,
	CreateOrUpdateHookParams,
	GraphqlEntityType,
	HookParams,
	HookRegister,
	Resolver,
	WithId,
	hookManagerMap,
} from '@exogee/graphweaver';
import { AuthenticationError, ValidationError } from 'apollo-server-errors';

import { ApiKeyStorage } from '../../entities';
import {
	ApiKeyInputArgs,
	ApiKeyCreateOrUpdateInputArgs,
	createApiKeyBaseResolver,
} from './base-resolver';
import { hashPassword } from '../../../utils/argon2id';

export const createApiKeyResolver = <G extends WithId, D extends ApiKeyStorage>(
	gqlEntityType: GraphqlEntityType<G, D>,
	provider: BackendProvider<D, G>
) => {
	@Resolver()
	class ApiKeyAuthResolver extends createApiKeyBaseResolver(gqlEntityType, provider) {
		provider = provider;

		public async runAfterHooks<
			H extends HookParams<ApiKeyInputArgs | ApiKeyCreateOrUpdateInputArgs>
		>(hookRegister: HookRegister, hookParams: H, entities: (D | null)[]): Promise<(D | null)[]> {
			const hookManager = hookManagerMap.get('ApiKey');
			const { entities: hookEntities = [] } = hookManager
				? await hookManager.runHooks(hookRegister, {
						...hookParams,
						entities,
				  })
				: { entities };

			return hookEntities;
		}

		async create(params: CreateOrUpdateHookParams<ApiKeyInputArgs>): Promise<D> {
			const [item] = params.args.items;
			if (!item) throw new ValidationError('No data specified cannot continue.');

			if (!item.key) throw new ValidationError('Create unsuccessful: Key not defined.');

			if (!item.secret) throw new ValidationError('Create unsuccessful: Secret not defined.');

			const secretHash = await hashPassword(item.secret);
			const apiKey = await this.provider.createOne({
				key: item.key,
				secret: secretHash,
				...(Object(item).hasOwnProperty('revoked') ? { revoked: item.revoked } : {}),
				...(Object(item).hasOwnProperty('roles') ? { roles: item.roles } : {}),
			} as unknown as Partial<G>);

			const [entity] = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [apiKey]);
			if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			return entity;
		}

		async update(params: CreateOrUpdateHookParams<ApiKeyCreateOrUpdateInputArgs>): Promise<D> {
			const [item] = params.args.items;
			if (!item.id) throw new ValidationError('Update unsuccessful: No ID sent in request.');

			if (!item.key && !item.key)
				throw new ValidationError('Update unsuccessful: Nothing to update.');

			const secretHash = item.secret ? await hashPassword(item.secret) : undefined;

			const apiKey = await this.provider.updateOne(item.id, {
				...(item.key ? { key: item.key } : {}),
				...(secretHash ? { secret: secretHash } : {}),
				...(Object(item).hasOwnProperty('revoked') ? { revoked: item.revoked } : {}),
				...(Object(item).hasOwnProperty('roles') ? { roles: item.roles } : {}),
			} as Partial<G>);

			const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [apiKey]);
			if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			return apiKey;
		}
	}

	return ApiKeyAuthResolver;
};
