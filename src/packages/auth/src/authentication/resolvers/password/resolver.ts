import { BackendProvider, Resolver } from '@exogee/graphweaver';
import * as argon2 from 'argon2';

import { PasswordStorage } from '../../entities';
import { createBasePasswordAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';
import { AuthenticationError } from 'apollo-server-errors';
import { RequestParams } from '../../../types';

type PasswordProvider = BackendProvider<PasswordStorage, PasswordStorage>;
export enum PasswordOperation {
	LOGIN = 'login',
	REGISTER = 'register',
}

@Resolver()
export class PasswordAuthResolver extends createBasePasswordAuthResolver() {
	private provider: PasswordProvider;

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

		if (await argon2.verify(credential.password, password)) {
			return this.getUser(credential.id, PasswordOperation.LOGIN, params);
		}

		throw new AuthenticationError('Bad Request: Authentication Failed. (E0003)');
	}

	async save(username: string, password: string, params: RequestParams): Promise<UserProfile> {
		const passwordHash = await argon2.hash(password);
		const credential = await this.provider.createOne({ username, password: passwordHash });

		if (!credential) throw new AuthenticationError('Bad Request: Authentication Save Failed.');
		return this.getUser(credential.id, PasswordOperation.REGISTER, params);
	}
}
