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
import { Authentication } from '../../../entities';

enum AuthenticationType {
	PasskeyChallenge = 'PasskeyChallenge',
	PasskeyAuthenticator = 'PasskeyAuthenticator',
}

type PasskeyChallenge = {
	userId: string;
	challenge: string;
};

type PasskeyAuthenticator = {
	userId: string;
	credentialID: string;
	credentialPublicKey: string;
	counter: number;
};

@Resolver()
export class PasskeyAuthResolver extends AuthResolver {
	private database: DatabaseImplementation;
	constructor() {
		super();
		this.database = ConnectionManager.database(myConnection.connectionManagerId);
	}

	public async getUserCurrentChallenge(userId: string): Promise<string> {
		const passkeyChallenge = await this.database.em.findOneOrFail<Authentication<PasskeyChallenge>>(
			Authentication,
			{
				type: AuthenticationType.PasskeyChallenge,
				data: {
					userId,
				},
			},
			{ orderBy: { id: QueryOrder.DESC } }
		);

		return passkeyChallenge.data.challenge;
	}

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {
		const passkeyChallenge = new Authentication();
		wrap(passkeyChallenge).assign(
			{
				type: AuthenticationType.PasskeyChallenge,
				data: {
					userId,
					challenge,
				},
			},
			{ em: this.database.em }
		);
		await this.database.em.persistAndFlush(passkeyChallenge);
		return true;
	}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {
		const authenticators = await this.database.em.find<Authentication<PasskeyAuthenticator>>(
			Authentication,
			{
				type: AuthenticationType.PasskeyAuthenticator,
				data: {
					userId,
				},
			}
		);

		return authenticators.map<PasskeyAuthenticatorDevice>(
			({ id, data: { credentialID, credentialPublicKey, counter } }) => ({
				id: id,
				credentialID,
				credentialPublicKey,
				counter,
			})
		);
	}

	public async getUserAuthenticator(
		userId: string,
		credentialID: string
	): Promise<PasskeyAuthenticatorDevice> {
		const {
			id,
			data: { credentialPublicKey, counter },
		} = await this.database.em.findOneOrFail<Authentication<PasskeyAuthenticator>>(Authentication, {
			type: AuthenticationType.PasskeyAuthenticator,
			data: {
				userId,
				credentialID,
			},
		});

		return {
			id,
			credentialID,
			credentialPublicKey,
			counter,
		};
	}

	public async saveNewUserAuthenticator(
		userId: string,
		authenticator: PasskeyAuthenticatorDevice
	): Promise<boolean> {
		const passkeyAuthenticator = new Authentication<PasskeyAuthenticator>();
		wrap(passkeyAuthenticator).assign(
			{
				type: AuthenticationType.PasskeyAuthenticator,
				data: {
					userId,
					credentialID: authenticator.credentialID,
					credentialPublicKey: authenticator.credentialPublicKey,
					counter: authenticator.counter,
				},
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
		const passkeyAuthenticator = await this.database.em.findOneOrFail<
			Authentication<PasskeyAuthenticator>
		>(Authentication, {
			type: AuthenticationType.PasskeyAuthenticator,
			id: authenticatorId,
		});

		passkeyAuthenticator.data.counter = counter;
		await this.database.em.persistAndFlush(passkeyAuthenticator);
		return true;
	}
}
