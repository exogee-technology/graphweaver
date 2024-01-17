import {
	PasswordOperation,
	RequestParams,
	UserProfile,
	createPasswordAuthResolver,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver, callChildMutation, createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User } from '../../user';
import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential as OrmCredential } from '../../../entities/mysql';
import { Credential } from './entity';

@Resolver()
export class PasswordAuthResolver extends createPasswordAuthResolver<OrmCredential>(
	Credential,
	new MikroBackendProvider(OrmCredential, myConnection)
) {
	async onUserAuthenticated(userId: string, params: RequestParams): Promise<null> {
		// This is called after a user has authenticated
		return;
	}

	async onUserRegistered(userId: string, params: RequestParams): Promise<null> {
		// This is called after a user has registered
		return;
	}

	// This is called when a user has logged in to get the profile
	async getUserProfile(
		id: string,
		operation: PasswordOperation,
		params: RequestParams
	): Promise<UserProfile> {
		const user = User.fromBackendEntity(await BaseLoaders.loadOne({ gqlEntityType: User, id }));

		if (!user) throw new Error('Bad Request: Unknown user id provided.');

		if (operation === PasswordOperation.REGISTER) {
			// As an example we are sending an OTP challenge to the user during registration
			await callChildMutation('sendOTPChallenge', {}, params.info, params.ctx);
		}

		return mapUserToProfile(user);
	}
}
