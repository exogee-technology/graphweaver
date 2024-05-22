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
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { logger } from '@exogee/logger';

import { AuthenticationMethod, AuthenticationType, AuthorizationContext } from '../../types';
import { AuthenticationBaseEntity, Token } from '../entities';
import { AuthTokenProvider, verifyAndCreateTokenFromAuthToken } from '../token';
import { ChallengeError } from '../../errors';
import {
	BackendProvider,
	Field,
	ID,
	InputType,
	Sort,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { GraphQLResolveInfo, Source } from 'graphql';

export type { AuthenticatorTransportFuture as PasskeyAuthenticatorTransportFuture } from '@simplewebauthn/types';

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

export interface PasskeyAuthenticatorDevice {
	id: string;
	credentialPublicKey: string;
	credentialID: string;
	counter: number;
}

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

export class Passkey {
	private passkeyChallengeProvider: PasskeyChallengeProvider;
	private passkeyAuthenticatorProvider: PasskeyAuthenticatorProvider;
	constructor({
		passkeyChallengeProvider,
		passkeyAuthenticatorProvider,
	}: {
		passkeyChallengeProvider: PasskeyChallengeProvider;
		passkeyAuthenticatorProvider: PasskeyAuthenticatorProvider;
	}) {
		this.passkeyChallengeProvider = passkeyChallengeProvider;
		this.passkeyAuthenticatorProvider = passkeyAuthenticatorProvider;

		graphweaverMetadata.addMutation({
			name: 'passkeyGenerateRegistrationOptions',
			getType: () => GraphQLJSON,
			resolver: this.passkeyGenerateRegistrationOptions.bind(this),
		});

		graphweaverMetadata.addMutation({
			name: 'passkeyVerifyRegistrationResponse',
			args: {
				registrationResponse: PasskeyRegistrationResponse,
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
				authenticationResponse: PasskeyAuthenticationResponse,
			},
			resolver: this.passkeyVerifyAuthenticationResponse.bind(this),
		});
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
		authenticator: PasskeyAuthenticatorDevice | Omit<PasskeyAuthenticatorDevice, 'id'>
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

	async passkeyGenerateRegistrationOptions(
		_: Source,
		_args: Record<string, undefined>,
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<PublicKeyCredentialCreationOptionsJSON> {
		if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

		const userId = context.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const username = context.user?.username;
		if (!username) throw new AuthenticationError('Authentication failed.');

		const userAuthenticators = await this.getUserAuthenticators(userId);

		const options = await generateRegistrationOptions({
			rpName: config.rp.name,
			rpID: config.rp.id,
			userID: userId,
			userName: username,
			attestationType: 'none',
			excludeCredentials: userAuthenticators.map((authenticator) => ({
				id: isoBase64URL.toBuffer(authenticator.credentialID),
				type: 'public-key',
			})),
		});

		await this.setUserCurrentChallenge(userId, options.challenge);

		return options;
	}

	async passkeyVerifyRegistrationResponse(
		_: Source,
		{ registrationResponse }: { registrationResponse: PasskeyRegistrationResponse },
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<boolean> {
		try {
			if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Authentication failed.');

			const expectedChallenge = await this.getUserCurrentChallenge(userId);

			const verification = await verifyRegistrationResponse({
				response: registrationResponse,
				expectedChallenge,
				expectedOrigin: config.origin,
				expectedRPID: config.rp.id,
			});

			const { verified, registrationInfo } = verification;

			if (verified) {
				if (!registrationInfo?.credentialPublicKey)
					throw new AuthenticationError('Authentication failed: No Public Key Found');

				const newAuthenticator: Omit<PasskeyAuthenticatorDevice, 'id'> = {
					credentialID: isoBase64URL.fromBuffer(registrationInfo.credentialID),
					credentialPublicKey: isoBase64URL.fromBuffer(registrationInfo.credentialPublicKey),
					counter: registrationInfo.counter ?? 0,
				};

				await this.saveNewUserAuthenticator(userId, newAuthenticator);
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

	async passkeyGenerateAuthenticationOptions(
		_: Source,
		_args: Record<string, undefined>,
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<PublicKeyCredentialRequestOptionsJSON> {
		if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

		const userId = context.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const userAuthenticators = await this.getUserAuthenticators(userId);

		const options = await generateAuthenticationOptions({
			// Require users to use a previously-registered authenticator
			allowCredentials: userAuthenticators.map((authenticator) => ({
				id: isoBase64URL.toBuffer(authenticator.credentialID),
				type: 'public-key',
			})),
			userVerification: 'preferred',
		});

		// Remember this challenge for this user
		await this.setUserCurrentChallenge(userId, options.challenge);

		return options;
	}

	async passkeyVerifyAuthenticationResponse(
		_: Source,
		{ authenticationResponse }: { authenticationResponse: PasskeyAuthenticationResponse },
		context: AuthorizationContext,
		_info: GraphQLResolveInfo
	): Promise<Token> {
		try {
			if (!context.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = context.user?.id;
			if (!userId) throw new AuthenticationError('Authentication failed.');

			const expectedChallenge = await this.getUserCurrentChallenge(userId);
			const authenticator = await this.getUserAuthenticator(userId, authenticationResponse.id);

			if (!authenticator) {
				throw new AuthenticationError(
					`Could not find authenticator ${authenticationResponse.id} for user ${userId}`
				);
			}

			const verification = await verifyAuthenticationResponse({
				response: authenticationResponse,
				expectedChallenge,
				expectedOrigin: config.origin,
				expectedRPID: config.rp.id,
				authenticator: {
					credentialPublicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
					credentialID: isoBase64URL.toBuffer(authenticator.credentialID),
					counter: authenticator.counter,
				},
			});

			const { verified } = verification;

			if (!verified)
				throw new AuthenticationError(`Authentication failed: The request was not verified.`);
			const { authenticationInfo } = verification;
			const { newCounter } = authenticationInfo;

			await this.saveUpdatedAuthenticatorCounter(authenticator.id, newCounter);

			// Upgrade Token
			const tokenProvider = new AuthTokenProvider(AuthenticationMethod.PASSKEY);
			const existingAuthToken =
				typeof context.token === 'string'
					? await tokenProvider.decodeToken(context.token)
					: context.token;
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);

			return verifyAndCreateTokenFromAuthToken(authToken);
		} catch (e: any) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.error('Authentication failed with error', e);
			throw new AuthenticationError('Passkey authentication failed.');
		}
	}
}
