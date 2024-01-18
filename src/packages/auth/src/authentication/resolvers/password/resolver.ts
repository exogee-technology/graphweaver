import {
	BackendProvider,
	BaseDataEntity,
	Filter,
	GraphqlEntityType,
	Resolver,
	WithId,
} from '@exogee/graphweaver';

import { Credential, CredentialStorage } from '../../entities';
import { createBasePasswordAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationError } from 'apollo-server-errors';
import { RequestParams } from '../../../types';
import { hashPassword, verifyPassword } from '../../../utils/argon2id';

export enum PasswordOperation {
	LOGIN = 'login',
	REGISTER = 'register',
}

export const createPasswordAuthResolver = <D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<Credential<D>, D>,
	provider: BackendProvider<D, Credential<D>>
) => {
	@Resolver()
	class PasswordAuthResolver extends createBasePasswordAuthResolver(gqlEntityType, provider) {
		public provider = provider;
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

		async create(username: string, password: string, params: RequestParams): Promise<UserProfile> {
			const passwordHash = await hashPassword(password);
			const credential = (await this.provider.createOne({
				username,
				password: passwordHash,
			} as any)) as unknown as CredentialStorage;

			if (!credential) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			this.onUserRegistered?.(credential.id, params);

			return this.getUserProfile(credential.id, PasswordOperation.REGISTER, params);
		}

		async update(
			id: string,
			data: { username?: string; password?: string },
			params: RequestParams
		): Promise<UserProfile> {
			if (data.password) {
				data.password = await hashPassword(data.password);
			}
			const credential = (await this.provider.updateOne(id, data)) as unknown as CredentialStorage;

			if (!credential) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

			return this.getUserProfile(credential.id, PasswordOperation.REGISTER, params);
		}
	}

	return PasswordAuthResolver;
};
