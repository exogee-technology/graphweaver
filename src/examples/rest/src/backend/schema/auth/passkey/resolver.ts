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

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {
		const passkeyChallenge = new PasskeyChallenge();
		wrap(passkeyChallenge).assign(
			{
				userId,
				challenge,
			},
			{ em: this.database.em }
		);
		this.database.em.persistAndFlush(passkeyChallenge);
		return true;
	}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {
		const authenticators = await this.database.em.find(PasskeyAuthenticator, {
			userId,
		});

		if (!authenticators) throw new Error('Bad Request: User has no authenticators.');

		return authenticators;
	}

	public async getUserAuthenticator(
		userId: string,
		credentialID: string
	): Promise<PasskeyAuthenticatorDevice> {
		const authenticator = await this.database.em.findOneOrFail(PasskeyAuthenticator, {
			userId,
			credentialID,
		});

		if (!authenticator) throw new Error('Bad Request: User has no authenticator.');

		return authenticator;
	}

	public async saveNewUserAuthenticator(
		userId: string,
		authenticator: PasskeyAuthenticatorDevice
	): Promise<boolean> {
		const passkeyAuthenticator = new PasskeyAuthenticator();
		wrap(passkeyAuthenticator).assign(
			{
				userId,
				...authenticator,
			},
			{ em: this.database.em }
		);
		await this.database.em.persistAndFlush(passkeyAuthenticator);
		return true;
	}

	public async saveUpdatedAuthenticatorCounter(
		authenticatorId: string,
		counter: number
	): Promise<boolean> {
		const passkeyAuthenticator = await this.database.em.findOneOrFail(PasskeyAuthenticator, {
			id: authenticatorId,
		});

		passkeyAuthenticator.counter = counter;
		await this.database.em.persistAndFlush(passkeyAuthenticator);

		return true;
	}
}
