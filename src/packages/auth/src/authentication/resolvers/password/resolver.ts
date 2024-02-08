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

import { Credential, CredentialStorage } from '../../entities';
import { CredentialCreateOrUpdateInputArgs, createBasePasswordAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { ApolloError, AuthenticationError, ValidationError } from 'apollo-server-errors';
import { RequestParams } from '../../../types';
import { hashPassword, verifyPassword } from '../../../utils/argon2id';
import { runAfterHooks, updatePassword } from '../utils';

export enum PasswordOperation {
	LOGIN = 'login',
	REGISTER = 'register',
}

export class PasswordStrengthError extends ApolloError {
	constructor(message: string, extensions?: Record<string, any>) {
		super(message, 'WEAK_PASSWORD', extensions);

		Object.defineProperty(this, 'name', { value: 'WeakPasswordError' });
	}
}

export const defaultPasswordStrength = (password?: string) => {
	// Default password strength check is 8 characters or more
	if (password && password.length > 7) return true;
	throw new PasswordStrengthError('Password not strong enough.');
};

export const createPasswordAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Credential<D>, D>,
	provider: BackendProvider<D, Credential<D>>,
	assertPasswordStrength?: (password?: string) => boolean
) => {
	@Resolver()
	class PasswordAuthResolver extends createBasePasswordAuthResolver(gqlEntityType, provider) {
		provider = provider;
		assertPasswordStrength = assertPasswordStrength ?? defaultPasswordStrength;
		onUserAuthenticated?(userId: string, params: RequestParams): Promise<null>;
		onUserRegistered?(userId: string, params: RequestParams): Promise<null>;

		async getUserProfile(
			id: string,
			operation: PasswordOperation,
			params: RequestParams
		): Promise<UserProfile> {
			// Use the operation type to decide what actions to perform
			// A register action could send an email verification for example
			throw new Error(
				'Method getUser not implemented for PasswordAuthResolver: Override this function to return a user profile'
			);
		}

		async authenticate(
			username: string,
			password: string,
			params: RequestParams
		): Promise<UserProfile> {
			const credential = (await this.provider.findOne({
				username,
			} as Filter<CredentialStorage>)) as CredentialStorage | null;

			if (!credential) throw new AuthenticationError('Bad Request: Authentication Failed. (E0001)');
			if (!credential.password)
				throw new AuthenticationError('Bad Request: Authentication Failed. (E0002)');

			if (await verifyPassword(password, credential.password)) {
				return this.getUserProfile(credential.id, PasswordOperation.LOGIN, params);
			}

			this.onUserAuthenticated?.(credential.id, params);

			throw new AuthenticationError('Bad Request: Authentication Failed. (E0003)');
		}

		async create(
			params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
		): Promise<UserProfile> {
			const [item] = params.args.items;
			if (!item) throw new Error('No data specified cannot continue.');

			if (!item.username) throw new ValidationError('Create unsuccessful: Username not defined.');

			if (!item.password) throw new ValidationError('Create unsuccessful: Password not defined.');

			this.assertPasswordStrength(item.password);

			if (item.password !== item.confirm)
				throw new ValidationError('Create unsuccessful: Passwords do not match.');

			const passwordHash = await hashPassword(item.password);
			const credential = await this.provider.createOne({
				username: item.username,
				password: passwordHash,
			} as Credential<D> & { password: string });

			const [entity] = await runAfterHooks(HookRegister.AFTER_CREATE, [credential], params);
			if (!entity) throw new AuthenticationError('Bad Request: Authentication Save Failed.');
			this.onUserRegistered?.(entity.id, { info: params.info, ctx: params.context });

			return this.getUserProfile(entity.id, PasswordOperation.REGISTER, {
				info: params.info,
				ctx: params.context,
			});
		}

		async update(
			params: CreateOrUpdateHookParams<CredentialCreateOrUpdateInputArgs>
		): Promise<UserProfile> {
			const [item] = params.args.items;
			if (!item.id) throw new ValidationError('Update unsuccessful: No ID sent in request.');

			if (item.password && item.password !== item.confirm)
				throw new ValidationError('Update unsuccessful: Passwords do not match.');

			if (!item.username && !item.password)
				throw new ValidationError('Update unsuccessful: Nothing to update.');

			const entity = await updatePassword(
				this.assertPasswordStrength,
				this.provider,
				item.id,
				item.password,
				undefined,
				params
			);

			return this.getUserProfile(entity.id, PasswordOperation.REGISTER, {
				info: params.info,
				ctx: params.context,
			});
		}
	}

	return PasswordAuthResolver;
};
