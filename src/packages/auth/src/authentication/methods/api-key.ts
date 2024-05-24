import {
	BackendProvider,
	CreateOrUpdateHookParams,
	Field,
	FieldMetadata,
	FieldOptions,
	HookParams,
	HookRegister,
	ID,
	InputType,
	graphweaverMetadata,
	hookManagerMap,
	runWritableBeforeHooks,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-errors';
import { GraphQLResolveInfo, Source } from 'graphql';

import { AccessControlList, AuthorizationContext } from '../../types';
import { ApiKeyStorage, ApiKeyEntity } from '../entities';
import { hashPassword } from '../../utils/argon2id';
import { AclMap } from '../../helper-functions';

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

@InputType(`ApiKeyUpdateInput`)
export class ApiKeyUpdateInputArgs<R> {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	key?: string;

	@Field(() => String, { nullable: true })
	secret?: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: R[];
}

type ApiKeyProvider<R> = BackendProvider<ApiKeyStorage<R>, ApiKeyEntity<ApiKeyStorage<R>, R>>;

export class ApiKey<R> {
	private provider: ApiKeyProvider<R>;
	private transactional: boolean;

	constructor({
		provider,
		roles,
		acl,
	}: {
		provider: ApiKeyProvider<R>;
		roles: unknown;
		acl?: AccessControlList<ApiKeyEntity<ApiKeyStorage<R>, R>, AuthorizationContext>;
	}) {
		this.provider = provider;
		this.transactional = !!provider.withTransaction;

		if (acl) {
			// Override the ACL for the Credential entity
			AclMap.set('ApiKey', acl);
		}

		// Collect the provider information for the API Key entity
		graphweaverMetadata.collectProviderInformationForEntity<
			typeof ApiKeyEntity<ApiKeyStorage<R>, R>,
			ApiKeyStorage<R>
		>({
			provider: this.provider as BackendProvider<
				ApiKeyStorage<R>,
				typeof ApiKeyEntity<ApiKeyStorage<R>, R>
			>,
			target: ApiKeyEntity<ApiKeyStorage<R>, R>,
		});

		// Override the roles field for the API Key entity
		const metadata = graphweaverMetadata.getEntityByName('ApiKey');
		const roleFieldMetadata = metadata?.fields.roles as Pick<
			FieldMetadata<ApiKeyEntity<ApiKeyStorage<R>, R>, ApiKeyStorage<R>>,
			'target' | 'name' | 'getType' | 'relationshipInfo'
		>;
		graphweaverMetadata.collectFieldInformation({
			...roleFieldMetadata,
			getType: () => [roles],
		});

		// Add the createApiKey and updateApiKey mutations
		graphweaverMetadata.addMutation({
			name: 'createApiKey',
			args: {
				input: ApiKeyInputArgs,
			},
			getType: () => ApiKeyEntity<ApiKeyStorage<R>, R>,
			resolver: this.createApiKey.bind(this),
			intentionalOverride: true,
		});

		graphweaverMetadata.addMutation({
			name: 'updateApiKey',
			args: {
				input: ApiKeyUpdateInputArgs,
			},
			getType: () => ApiKeyEntity<ApiKeyStorage<R>, R>,
			resolver: this.updateApiKey.bind(this),
			intentionalOverride: true,
		});
	}

	public async withTransaction<T>(callback: () => Promise<T>) {
		return this.provider.withTransaction ? this.provider.withTransaction<T>(callback) : callback();
	}

	public async runAfterHooks<H extends HookParams<ApiKeyInputArgs | ApiKeyUpdateInputArgs<R>>>(
		hookRegister: HookRegister,
		hookParams: H,
		entities: (ApiKeyStorage<R> | null)[]
	): Promise<(ApiKeyStorage<R> | null)[]> {
		const hookManager = hookManagerMap.get('ApiKey');
		const { entities: hookEntities = [] } = hookManager
			? await hookManager.runHooks(hookRegister, {
					...hookParams,
					entities,
				})
			: { entities };

		return hookEntities;
	}

	async create(params: CreateOrUpdateHookParams<ApiKeyInputArgs>): Promise<ApiKeyStorage<R>> {
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
		} as ApiKeyStorage<R>);

		const [entity] = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [apiKey]);
		if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

		return entity;
	}

	async update(
		params: CreateOrUpdateHookParams<ApiKeyUpdateInputArgs<R>>
	): Promise<ApiKeyStorage<R>> {
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
		});

		const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [apiKey]);
		if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

		return apiKey;
	}

	async createApiKey(
		_: Source,
		{ input }: { input: ApiKeyInputArgs },
		context: AuthorizationContext,
		info: GraphQLResolveInfo
	): Promise<ApiKeyEntity<ApiKeyStorage<R>, R> | null> {
		return this.withTransaction(async () => {
			const params = {
				args: { items: [input] },
				info,
				context,
				transactional: this.transactional,
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

			return ApiKeyEntity.fromBackendEntity<ApiKeyStorage<R>, ApiKeyEntity<ApiKeyStorage<R>, R>>(
				apiKey
			);
		});
	}

	async updateApiKey(
		_: Source,
		{ input }: { input: ApiKeyUpdateInputArgs<R> },
		context: AuthorizationContext,
		info: GraphQLResolveInfo
	): Promise<ApiKeyEntity<ApiKeyStorage<R>, R> | null> {
		return this.withTransaction(async () => {
			const params = {
				args: { items: [input] },
				info,
				context,
				transactional: this.transactional,
			};

			let apiKey;
			try {
				const hookParams = await runWritableBeforeHooks<ApiKeyUpdateInputArgs<R>>(
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

			return ApiKeyEntity.fromBackendEntity<ApiKeyStorage<R>, ApiKeyEntity<ApiKeyStorage<R>, R>>(
				apiKey
			);
		});
	}
}
