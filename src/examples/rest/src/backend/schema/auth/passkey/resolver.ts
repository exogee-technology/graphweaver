import {
	PasskeyAuthResolver as AuthResolver,
	PasskeyAuthenticatorDevice,
} from '@exogee/graphweaver-auth';
import { Resolver } from '@exogee/graphweaver';
import {
	ConnectionManager,
	DatabaseImplementation,
	QueryOrder,
	wrap,
} from '@exogee/graphweaver-mikroorm';

import { myConnection } from '../../../database';
import { PasskeyAuthenticator, PasskeyChallenge } from '../../../entities';

@Resolver()
export class PasskeyAuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}

	public async getUserCurrentChallenge(userId: string): Promise<string> {
		const passkeyChallenge = await this.database.em.findOneOrFail(
			PasskeyChallenge,
			{
				userId,
			},
			{ orderBy: { id: QueryOrder.DESC } }
		);

		if (!passkeyChallenge) throw new Error('Bad Request: User has no recent challenge.');

		return passkeyChallenge.challenge;
	}

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {
		const authenticators = await this.database.em.find(PasskeyAuthenticator, {
			userId,
		});

		if (!authenticators) throw new Error('Bad Request: User has no authenticators.');

		return authenticators;
	}

	public async getUserAuthenticator(
		userId: string,
		authenticatorId: Uint8Array
	): Promise<PasskeyAuthenticatorDevice> {
		const authenticator = await this.database.em.findOneOrFail(PasskeyAuthenticator, {
			userId,
			credentialID: authenticatorId,
		});

		if (!authenticator) throw new Error('Bad Request: User has no authenticator.');

		return authenticator;
	}

	public async saveNewUserAuthenticator(
		userId: string,
		authenticator: PasskeyAuthenticatorDevice
	): Promise<boolean> {}

	public async saveUpdatedAuthenticatorCounter(
		authenticator: PasskeyAuthenticatorDevice,
		counter: number
	): Promise<boolean> {}
}
