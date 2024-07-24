import {
	BackendProvider,
	ResolverOptions,
	Field,
	FieldMetadata,
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

import { AccessControlList, AuthorizationContext } from '../../types';
import { ApiKeyEntity } from '../entities';
import { hashPassword } from '../../utils/argon2id';
import { AclMap } from '../../helper-functions';
import { BaseAuthMethod } from './base-auth-method';

@InputType(`ApiKeyInsertInput`)
export class ApiKeyInputArgs<R> {
	@Field(() => String)
	key!: string;

	@Field(() => String)
	secret!: string;

	@Field(() => Boolean, { nullable: true })
	revoked?: boolean;

	@Field(() => [String], { nullable: true })
	roles?: R[];
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

export type ApiKeyProvider<R> = BackendProvider<ApiKeyEntity<R>>;

export class ApiKey<R extends string> extends BaseAuthMethod {
	private provider: ApiKeyProvider<R>;
	private transactional: boolean;

	constructor({
		provider,
		roles,
		acl,
	}: {
		provider: ApiKeyProvider<R>;
		roles: unknown;
		acl?: AccessControlList<ApiKeyEntity<R>, AuthorizationContext>;
	}) {
		super();
		this.provider = provider;
		this.transactional = !!provider.withTransaction;

		if (acl) {
			// Override the ACL for the Credential entity
			AclMap.set('ApiKey', acl);
		}

		// Collect the provider information for the API Key entity
		graphweaverMetadata.collectProviderInformationForEntity({
			provider: this.provider,
			target: ApiKeyEntity,
		});

		// Override the roles field for the API Key entity
		const metadata = graphweaverMetadata.getEntityByName('ApiKey');
		const roleFieldMetadata = metadata?.fields.roles as unknown as Pick<
			FieldMetadata<ApiKeyEntity<R>, ApiKeyEntity<R>>,
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
				input: () => ApiKeyInputArgs,
			},
			getType: () => ApiKeyEntity<R>,
			resolver: this.createApiKey.bind(this),
			intentionalOverride: true,
		});

		graphweaverMetadata.addMutation({
			name: 'updateApiKey',
			args: {
				input: () => ApiKeyUpdateInputArgs,
			},
			getType: () => ApiKeyEntity<R>,
			resolver: this.updateApiKey.bind(this),
			intentionalOverride: true,
		});
	}

	public async withTransaction<T>(callback: () => Promise<T>) {
		return this.provider.withTransaction ? this.provider.withTransaction<T>(callback) : callback();
	}

	public async runAfterHooks<H extends HookParams<ApiKeyInputArgs<R> | ApiKeyUpdateInputArgs<R>>>(
		hookRegister: HookRegister,
		hookParams: H,
		entities: (ApiKeyEntity<R> | null)[]
	): Promise<(ApiKeyEntity<R> | null)[]> {
		const hookManager = hookManagerMap.get('ApiKey');
		const { entities: hookEntities = [] } = hookManager
			? await hookManager.runHooks(hookRegister, {
					...hookParams,
					entities,
				})
			: { entities };

		return hookEntities;
	}

	async createApiKey({
		args: { input },
		context,
		fields,
	}: ResolverOptions<{ input: ApiKeyInputArgs<R> }>): Promise<ApiKeyEntity<R> | null> {
		return this.withTransaction(async () => {
			const params = {
				args: { items: [input] },
				context,
				fields,
				transactional: this.transactional,
			};

			const hookParams = await runWritableBeforeHooks<ApiKeyInputArgs<R>>(
				HookRegister.BEFORE_CREATE,
				params,
				'ApiKey'
			);

			let apiKey;
			try {
				const [item] = hookParams.args.items;
				if (!item) throw new ValidationError('No data specified cannot continue.');
				if (!item.key) throw new ValidationError('Create unsuccessful: Key not defined.');
				if (!item.secret) throw new ValidationError('Create unsuccessful: Secret not defined.');

				const secretHash = await hashPassword(item.secret);
				const newApiKey = await this.provider.createOne({
					key: item.key,
					secret: secretHash,
					...(Object(item).hasOwnProperty('revoked') ? { revoked: item.revoked } : {}),
					...(Object(item).hasOwnProperty('roles') ? { roles: item.roles } : {}),
				});

				const entities = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [newApiKey]);
				if (!entities?.[0])
					throw new AuthenticationError('Bad Request: Authentication Save Failed.');

				apiKey = entities[0];
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

			return apiKey;
		});
	}

	async updateApiKey({
		args: { input },
		context,
		fields,
	}: ResolverOptions<{ input: ApiKeyUpdateInputArgs<R> }>): Promise<ApiKeyEntity<R> | null> {
		return this.withTransaction(async () => {
			const params = {
				args: { items: [input] },
				fields,
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
				const [item] = hookParams.args.items;
				if (!item.id) throw new ValidationError('Update unsuccessful: No ID sent in request.');

				if (!item.key && !item.key)
					throw new ValidationError('Update unsuccessful: Nothing to update.');

				const secretHash = item.secret ? await hashPassword(item.secret) : undefined;

				const newApiKey = await this.provider.updateOne(item.id, {
					...(item.key ? { key: item.key } : {}),
					...(secretHash ? { secret: secretHash } : {}),
					...(Object(item).hasOwnProperty('revoked') ? { revoked: item.revoked } : {}),
					...(Object(item).hasOwnProperty('roles') ? { roles: item.roles } : {}),
				});

				const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [newApiKey]);
				if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

				apiKey = entity;
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

			return apiKey;
		});
	}
}
