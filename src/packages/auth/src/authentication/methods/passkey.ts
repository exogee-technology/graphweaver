import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import type {
	AuthenticationResponseJSON,
	AuthenticatorAssertionResponseJSON,
	AuthenticatorAttestationResponseJSON,
	CredentialDeviceType,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { logger } from '@exogee/logger';

import { AuthenticationMethod, AuthenticationType, AuthorizationContext } from '../../types';
import { AuthenticationBaseEntity, Token } from '../entities';
import { AuthTokenProvider } from '../token';
import { ChallengeError } from '../../errors';
import {
	BackendProvider,
	Field,
	ID,
	InputType,
	ResolverOptions,
	Sort,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { BaseAuthMethod } from './base-auth-method';

export type { AuthenticatorTransportFuture as PasskeyAuthenticatorTransportFuture } from '@simplewebauthn/types';

export type PasskeyChallenge = {
	challenge: string;
};

export interface PasskeyAuthenticatorDeviceJSON {
	id: string;
	webAuthnUserID: string;
	publicKey: string;
	counter: number;
	deviceType: CredentialDeviceType;
	backedUp: boolean;
}

export type PasskeyAuthenticator = {
	credentialID: string;
	credentialPublicKey: string;
	counter: number;
};

export interface PasskeyAuthenticatorDevice {
	id: string;
	webAuthnUserID: string;
	publicKey: string;
	counter: number;
	deviceType: CredentialDeviceType;
	backedUp: boolean;
}

export type PasskeyData =
	| PublicKeyCredentialCreationOptionsJSON
	| PublicKeyCredentialRequestOptionsJSON
	| PasskeyAuthenticatorDeviceJSON;

type PasskeyDataProvider = BackendProvider<AuthenticationBaseEntity<PasskeyData>>;

@InputType('PasskeyRegistrationResponse')
export class PasskeyRegistrationResponse implements RegistrationResponseJSON {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	rawId!: string;

	@Field(() => GraphQLJSON)
	response!: AuthenticatorAttestationResponseJSON;

	@Field(() => String, { nullable: true })
	authenticatorAttachment?: AuthenticatorAttachment;

	@Field(() => GraphQLJSON)
	clientExtensionResults!: AuthenticationExtensionsClientOutputs;

	@Field(() => String)
	type!: PublicKeyCredentialType;
}

@InputType('PasskeyAuthenticationResponse')
export class PasskeyAuthenticationResponse implements AuthenticationResponseJSON {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	rawId!: string;

	@Field(() => GraphQLJSON)
	response!: AuthenticatorAssertionResponseJSON;

	@Field(() => String, { nullable: true })
	authenticatorAttachment?: AuthenticatorAttachment;

	@Field(() => GraphQLJSON)
	clientExtensionResults!: AuthenticationExtensionsClientOutputs;

	@Field(() => String)
	type!: PublicKeyCredentialType;
}

const config = {
	rp: {
		name: process.env.AUTH_PASSKEY_RELYING_PARTY_NAME ?? 'Graphweaver',
		id: process.env.AUTH_PASSKEY_RELYING_PARTY_ID || 'localhost',
	},
	origin: process.env.AUTH_PASSKEY_ORIGIN || 'http://localhost:9000',
};

export class Passkey extends BaseAuthMethod {
	private dataProvider: PasskeyDataProvider;
	constructor({ dataProvider }: { dataProvider: PasskeyDataProvider }) {
		super();
		this.dataProvider = dataProvider;

		graphweaverMetadata.addMutation({
			name: 'passkeyGenerateRegistrationOptions',
			getType: () => GraphQLJSON,
			resolver: this.passkeyGenerateRegistrationOptions.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'passkeyVerifyRegistrationResponse',
			args: {
				registrationResponse: () => PasskeyRegistrationResponse,
			},
			getType: () => Boolean,
			resolver: this.passkeyVerifyRegistrationResponse.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'passkeyGenerateAuthenticationOptions',
			getType: () => GraphQLJSON,
			resolver: this.passkeyGenerateAuthenticationOptions.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'passkeyVerifyAuthenticationResponse',
			getType: () => Token,
			args: {
				authenticationResponse: () => PasskeyAuthenticationResponse,
			},
			resolver: this.passkeyVerifyAuthenticationResponse.bind(this),
		});
	}

	public async getUserPasskeys(userId: string): Promise<PasskeyAuthenticatorDeviceJSON[]> {
		const passkeyAuthentications = (await this.dataProvider.find({
			type: AuthenticationType.PasskeyAuthenticatorDevice,
			userId,
		})) as AuthenticationBaseEntity<PasskeyAuthenticatorDeviceJSON>[];

		return passkeyAuthentications.map<PasskeyAuthenticatorDeviceJSON>(({ data }) => data);
	}

	public async getUserPasskeyWithID(
		userId: string,
		id: string
	): Promise<PasskeyAuthenticatorDeviceJSON> {
		const passkeyAuthentications = (await this.dataProvider.find(
			{
				type: AuthenticationType.PasskeyAuthenticatorDevice,
				userId,
				data: {
					id,
				},
			},
			{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
		)) as AuthenticationBaseEntity<PasskeyAuthenticatorDeviceJSON>[];

		const [passkeyAuthentication] = passkeyAuthentications;

		if (!passkeyAuthentication) {
			throw new AuthenticationError('Passkey Authenticator not found');
		}

		return passkeyAuthentication.data;
	}

	public async saveNewPasskey(
		userId: string,
		passkey: PasskeyAuthenticatorDeviceJSON
	): Promise<boolean> {
		await this.dataProvider.createOne({
			type: AuthenticationType.PasskeyAuthenticatorDevice,
			userId,
			data: passkey,
		});
		return true;
	}

	public async saveUpdatedPasskeyCounter(
		userId: string,
		passkeyId: string,
		counter: number
	): Promise<boolean> {
		const passkeyAuthentication = await this.dataProvider.findOne({
			type: AuthenticationType.PasskeyAuthenticatorDevice,
			userId,
			data: {
				id: passkeyId,
			},
		});

		if (!passkeyAuthentication) {
			throw new AuthenticationError('Passkey Authenticator not found');
		}

		await this.dataProvider.updateOne(passkeyAuthentication.id, {
			data: {
				...passkeyAuthentication.data,
				counter,
			},
		});

		return true;
	}

	async passkeyGenerateRegistrationOptions({
		context,
	}: ResolverOptions<
		unknown,
		AuthorizationContext
	>): Promise<PublicKeyCredentialCreationOptionsJSON> {
		if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

		const userId = context.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const username = context.user?.username;
		if (!username) throw new AuthenticationError('Authentication failed.');

		const userPasskeys = await this.getUserPasskeys(userId);

		const options = await generateRegistrationOptions({
			rpName: config.rp.name,
			rpID: config.rp.id,
			userName: username,
			attestationType: 'none',
			excludeCredentials: userPasskeys.map((passkey) => ({
				id: passkey.id,
			})),
		});

		// Remember this creation challenge for this user
		await this.dataProvider.createOne({
			type: AuthenticationType.PasskeyCredentialCreationOptions,
			userId,
			data: options,
		});

		return options;
	}

	async passkeyVerifyRegistrationResponse({
		args: { registrationResponse },
		context,
	}: ResolverOptions<
		{ registrationResponse: PasskeyRegistrationResponse },
		AuthorizationContext
	>): Promise<boolean> {
		try {
			if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Authentication failed.');

			const [currentOptions] = (await this.dataProvider.find(
				{
					type: AuthenticationType.PasskeyCredentialCreationOptions,
					userId,
				},
				{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
			)) as AuthenticationBaseEntity<PublicKeyCredentialCreationOptionsJSON>[];

			if (!currentOptions) throw new AuthenticationError('Authentication failed.');

			const verification = await verifyRegistrationResponse({
				response: registrationResponse,
				expectedChallenge: currentOptions.data.challenge,
				expectedOrigin: config.origin,
				expectedRPID: config.rp.id,
			});

			const { verified, registrationInfo } = verification;

			if (verified) {
				if (!registrationInfo?.credentialPublicKey)
					throw new AuthenticationError('Authentication failed: No Public Key Found');

				const newPasskey: PasskeyAuthenticatorDeviceJSON = {
					id: registrationInfo.credentialID,
					// Created by `generateRegistrationOptions()`
					webAuthnUserID: currentOptions.data.user.id,
					publicKey: isoBase64URL.fromBuffer(registrationInfo.credentialPublicKey),
					counter: registrationInfo.counter ?? 0,
					deviceType: registrationInfo.credentialDeviceType,
					// Whether the passkey has been backed up in some way
					backedUp: registrationInfo.credentialBackedUp,
				};

				await this.saveNewPasskey(userId, newPasskey);
			}

			return verified;
		} catch (e: any) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Passkey authentication failed.');
		}
	}

	async passkeyGenerateAuthenticationOptions({
		context,
	}: ResolverOptions<
		unknown,
		AuthorizationContext
	>): Promise<PublicKeyCredentialRequestOptionsJSON> {
		if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

		const userId = context.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const userPasskeys = await this.getUserPasskeys(userId);

		const options = await generateAuthenticationOptions({
			rpID: config.rp.id,
			// Require users to use a previously-registered passkey
			allowCredentials: userPasskeys.map((passkey) => ({
				id: passkey.id,
			})),
		});

		// Remember this challenge for this user
		await this.dataProvider.createOne({
			type: AuthenticationType.PasskeyCredentialRequestOptions,
			userId,
			data: options,
		});

		return options;
	}

	async passkeyVerifyAuthenticationResponse({
		args: { authenticationResponse },
		context,
	}: ResolverOptions<
		{ authenticationResponse: PasskeyAuthenticationResponse },
		AuthorizationContext
	>): Promise<Token> {
		try {
			if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Authentication failed.');

			const [currentOptions] = (await this.dataProvider.find(
				{
					type: AuthenticationType.PasskeyCredentialRequestOptions,
					userId,
				},
				{ limit: 1, orderBy: { id: Sort.DESC }, offset: 0 }
			)) as AuthenticationBaseEntity<PublicKeyCredentialRequestOptionsJSON>[];

			if (!currentOptions) throw new AuthenticationError('Authentication failed.');

			const passkey = await this.getUserPasskeyWithID(userId, authenticationResponse.id);

			if (!passkey) {
				throw new AuthenticationError(
					`Could not find passkey ${authenticationResponse.id} for user ${userId}`
				);
			}

			const verification = await verifyAuthenticationResponse({
				response: authenticationResponse,
				expectedChallenge: currentOptions.data.challenge,
				expectedOrigin: config.origin,
				expectedRPID: config.rp.id,
				authenticator: {
					credentialID: passkey.id,
					credentialPublicKey: isoBase64URL.toBuffer(passkey.publicKey),
					counter: passkey.counter,
				},
			});

			const { verified } = verification;

			if (!verified)
				throw new AuthenticationError(`Authentication failed: The request was not verified.`);
			const { authenticationInfo } = verification;
			const { newCounter } = authenticationInfo;

			await this.saveUpdatedPasskeyCounter(userId, passkey.id, newCounter);

			// Upgrade Token
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSKEY);
			const existingAuthToken =
				typeof context.token === 'string'
					? await tokenProvider.decodeToken(context.token)
					: context.token;
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);

			return authToken;
		} catch (e: any) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Passkey authentication failed.');
		}
	}
}
