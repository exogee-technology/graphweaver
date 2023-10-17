import {
	PasswordAuthResolver as AuthResolver,
	PasswordOperation,
	RequestParams,
	UserProfile,
} from '@exogee/graphweaver-auth';
import { BaseLoaders, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User } from '../../user';
import { mapUserToProfile } from '../../../auth/context';
import { myConnection } from '../../../database';
import { Credential } from '../../../entities/mysql';
import { callChildMutation } from '@exogee/graphweaver';

@Resolver()
export class PasswordAuthResolver extends AuthResolver {
	constructor() {
		super({
			provider: new MikroBackendProvider(Credential, myConnection),
		});
	}

	protected async onUserAuthenticated(userId: string, params: RequestParams): Promise<null> {
		// This is called after a user has authenticated
		return;
	}

	protected async onUserRegistered(userId: string, params: RequestParams): Promise<null> {
		// As an example we are sending an OTP challenge to the user during registration
		await callChildMutation('sendOTPChallenge', {}, params.info, params.ctx);
		return;
	}

	async getUser(
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
