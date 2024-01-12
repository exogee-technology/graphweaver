import { BackendProvider, Resolver } from '@exogee/graphweaver';

import { PasswordStorage } from '../../entities';
import { createBasePasswordAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationError } from 'apollo-server-errors';
import { RequestParams } from '../../../types';
import { hashPassword, verifyPassword } from '../../../utils/argon2id';

type PasswordProvider = BackendProvider<PasswordStorage, PasswordStorage>;
export enum PasswordOperation {
	LOGIN = 'login',
	REGISTER = 'register',
}

@Resolver()
export class PasswordAuthResolver extends createBasePasswordAuthResolver() {
	private provider: PasswordProvider;
	protected onUserAuthenticated?(userId: string, params: RequestParams): Promise<null>;
	protected onUserRegistered?(userId: string, params: RequestParams): Promise<null>;

	constructor({ provider }: { provider: PasswordProvider }) {
		super();
		this.provider = provider;
	}

	async getUser(
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
		const credential = await this.provider.findOne({ username });

		if (!credential) throw new AuthenticationError('Bad Request: Authentication Failed. (E0001)');
		if (!credential.password)
			throw new AuthenticationError('Bad Request: Authentication Failed. (E0002)');

		if (await verifyPassword(password, credential.password)) {
			return this.getUser(credential.id, PasswordOperation.LOGIN, params);
		}

		this.onUserAuthenticated?.(credential.id, params);

		throw new AuthenticationError('Bad Request: Authentication Failed. (E0003)');
	}

	async save(username: string, password: string, params: RequestParams): Promise<UserProfile> {
		const passwordHash = await hashPassword(password);
		const credential = await this.provider.createOne({ username, password: passwordHash });

		if (!credential) throw new AuthenticationError('Bad Request: Authentication Save Failed.');

		this.onUserRegistered?.(credential.id, params);

		return this.getUser(credential.id, PasswordOperation.REGISTER, params);
	}
}
