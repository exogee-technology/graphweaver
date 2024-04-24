import { BackendProvider, Sort } from '@exogee/graphweaver';

import { createBasePasskeyAuthResolver, PasskeyAuthenticatorDevice } from './base-resolver';
import { AuthenticationType } from '../../../types';
import { AuthenticationBaseEntity } from '../../entities';
import { AuthenticationError } from 'apollo-server-errors';

export type PasskeyChallenge = {
	challenge: string;
};

export type PasskeyAuthenticator = {
	credentialID: string;
	credentialPublicKey: string;
	counter: number;
};

type PasskeyChallengeProvider = BackendProvider<
	AuthenticationBaseEntity<PasskeyChallenge>,
	AuthenticationBaseEntity<PasskeyChallenge>
>;

type PasskeyAuthenticatorProvider = BackendProvider<
	AuthenticationBaseEntity<PasskeyAuthenticator>,
	AuthenticationBaseEntity<PasskeyAuthenticator>
>;

export class PasskeyAuthResolver extends createBasePasskeyAuthResolver() {
	private passkeyChallengeProvider: PasskeyChallengeProvider;
	private passkeyAuthenticatorProvider: PasskeyAuthenticatorProvider;
	constructor({
		passkeyChallengeProvider,
		passkeyAuthenticatorProvider,
	}: {
		passkeyChallengeProvider: PasskeyChallengeProvider;
		passkeyAuthenticatorProvider: PasskeyAuthenticatorProvider;
	}) {
		super();
		this.passkeyChallengeProvider = passkeyChallengeProvider;
		this.passkeyAuthenticatorProvider = passkeyAuthenticatorProvider;
	}

	public async getUserCurrentChallenge(userId: string): Promise<string> {
		const result = await this.passkeyChallengeProvider.find(
			{
				type: AuthenticationType.PasskeyChallenge,
				userId,
			},
			{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
		);

		const [passkeyChallenge] = result;
		return passkeyChallenge.data.challenge;
	}

	public async setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean> {
		await this.passkeyChallengeProvider.createOne({
			type: AuthenticationType.PasskeyChallenge,
			userId,
			data: {
				challenge,
			},
		});

		return true;
	}

	public async getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]> {
		const authenticators = await this.passkeyAuthenticatorProvider.find({
			type: AuthenticationType.PasskeyAuthenticator,
			userId,
		});

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
		const authenticators = await this.passkeyAuthenticatorProvider.find(
			{
				type: AuthenticationType.PasskeyAuthenticator,
				userId,
				data: {
					credentialID,
				},
			},
			{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
		);

		const [authenticator] = authenticators;

		if (!authenticator) {
			throw new AuthenticationError('Passkey Authenticator not found');
		}

		return {
			id: authenticator.id,
			credentialID,
			credentialPublicKey: authenticator.data.credentialPublicKey,
			counter: authenticator.data.counter,
		};
	}

	public async saveNewUserAuthenticator(
		userId: string,
		authenticator: PasskeyAuthenticatorDevice
	): Promise<boolean> {
		await this.passkeyAuthenticatorProvider.createOne({
			type: AuthenticationType.PasskeyAuthenticator,
			userId,
			data: {
				credentialID: authenticator.credentialID,
				credentialPublicKey: authenticator.credentialPublicKey,
				counter: authenticator.counter,
			},
		});
		return true;
	}

	public async saveUpdatedAuthenticatorCounter(
		authenticatorId: string,
		counter: number
	): Promise<boolean> {
		const authenticator = await this.passkeyAuthenticatorProvider.findOne({
			id: authenticatorId,
		});

		if (!authenticator) {
			throw new AuthenticationError('Passkey Authenticator not found');
		}

		await this.passkeyAuthenticatorProvider.updateOne(authenticatorId, {
			data: {
				...authenticator.data,
				counter,
			},
		});

		return true;
	}
}
