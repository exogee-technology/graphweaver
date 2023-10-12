import { BackendProvider, Resolver } from '@exogee/graphweaver';
import * as argon2 from 'argon2';

import { PasswordStorage } from '../../entities';
import { createBasePasswordAuthResolver } from './base-resolver';
import { UserProfile } from '../../../user-profile';

type PasswordProvider = BackendProvider<PasswordStorage, PasswordStorage>;

@Resolver()
export class PasswordAuthResolver extends createBasePasswordAuthResolver() {
	private provider: PasswordProvider;

	constructor({ provider }: { provider: PasswordProvider }) {
		super();
		this.provider = provider;
	}

	async getUser(id: string): Promise<UserProfile> {
		throw new Error(
			'Method getUser not implemented for PasswordAuthResolver: Override this function to return a user profile'
		);
	}

	async authenticate(username: string, password: string): Promise<UserProfile> {
		const credential = await this.provider.findOne({ username });

		if (!credential) throw new Error('Bad Request: Unknown username provided.');

		if (await argon2.verify(credential.password, password)) {
			return this.getUser(credential.id);
		}

		throw new Error('Authentication Failed: Unknown username or password.');
	}
}
