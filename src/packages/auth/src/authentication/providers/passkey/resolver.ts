import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
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
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/typescript-types';
import { logger } from '@exogee/logger';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { Token } from '../../schema/token';
import { PasskeyRegistrationResponse, PasskeyAuthenticationResponse } from './entities';
import { AuthTokenProvider } from '../../token';
import { ChallengeError } from '../../../errors';

export type { AuthenticatorTransportFuture as PasskeyAuthenticatorTransportFuture } from '@simplewebauthn/typescript-types';

export interface PasskeyAuthenticatorDevice {
	id: string;
	credentialPublicKey: Uint8Array;
	credentialID: string;
	counter: number;
}

// Human-readable title for your website
const rpName = 'SimpleWebAuthn Example';
// A unique identifier for your website
const rpID = 'localhost';
// The URL at which registrations and authentications should occur
const origin = `http://${rpID}:9000`;

@Resolver((of) => Token)
export abstract class PasskeyAuthResolver {
	abstract getUserCurrentChallenge(userId: string): Promise<string>;
	abstract setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean>;
	abstract getUserAuthenticators(userId: string): Promise<PasskeyAuthenticatorDevice[]>;
	abstract getUserAuthenticator(
		userId: string,
		credentialID: string
	): Promise<PasskeyAuthenticatorDevice>;
	abstract saveNewUserAuthenticator(
		userId: string,
		authenticator: Omit<PasskeyAuthenticatorDevice, 'id'>
	): Promise<boolean>;
	abstract saveUpdatedAuthenticatorCounter(
		authenticatorId: string,
		counter: number
	): Promise<boolean>;

	@Mutation(() => GraphQLJSON)
	async passkeyGenerateRegistrationOptions(
		@Ctx() ctx: AuthorizationContext
	): Promise<PublicKeyCredentialCreationOptionsJSON> {
		const userId = ctx.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const username = ctx.user?.username;
		if (!username) throw new AuthenticationError('Authentication failed.');

		const userAuthenticators = await this.getUserAuthenticators(userId);

		const options = await generateRegistrationOptions({
			rpName,
			rpID,
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

	@Mutation(() => Boolean)
	async passkeyVerifyRegistrationResponse(
		@Arg('registrationResponse', () => PasskeyRegistrationResponse)
		registrationResponse: PasskeyRegistrationResponse,
		@Ctx() ctx: AuthorizationContext
	): Promise<boolean> {
		const userId = ctx.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const expectedChallenge = await this.getUserCurrentChallenge(userId);

		let verification;
		try {
			verification = await verifyRegistrationResponse({
				response: registrationResponse,
				expectedChallenge,
				expectedOrigin: origin,
				expectedRPID: rpID,
			});
		} catch (error: any) {
			throw new AuthenticationError(`Authentication failed: ${error?.message ?? ''}`);
		}

		const { verified, registrationInfo } = verification;

		if (verified) {
			if (!registrationInfo?.credentialPublicKey)
				throw new AuthenticationError('Authentication failed: No Public Key Found');

			const newAuthenticator: Omit<PasskeyAuthenticatorDevice, 'id'> = {
				credentialID: isoBase64URL.fromBuffer(registrationInfo.credentialID),
				credentialPublicKey: registrationInfo.credentialPublicKey,
				counter: registrationInfo.counter ?? 0,
			};

			await this.saveNewUserAuthenticator(userId, newAuthenticator);
		}

		return verified;
	}

	@Mutation(() => GraphQLJSON)
	async passkeyGenerateAuthenticationOptions(
		@Ctx() ctx: AuthorizationContext
	): Promise<PublicKeyCredentialRequestOptionsJSON> {
		const userId = ctx.user?.id;
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

		// (Pseudocode) Remember this challenge for this user
		await this.setUserCurrentChallenge(userId, options.challenge);

		return options;
	}

	@Mutation(() => Token)
	async passkeyVerifyAuthenticationResponse(
		@Arg('authenticationResponse', () => PasskeyAuthenticationResponse)
		authenticationResponse: PasskeyAuthenticationResponse,
		@Ctx() ctx: AuthorizationContext
	): Promise<Token> {
		try {
			const userId = ctx.user?.id;
			if (!userId) throw new AuthenticationError('Authentication failed.');
			if (!ctx.token) throw new AuthenticationError('Challenge unsuccessful: Token missing.');

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
				expectedOrigin: origin,
				expectedRPID: rpID,
				authenticator: {
					credentialPublicKey: authenticator.credentialPublicKey,
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
				typeof ctx.token === 'string' ? await tokenProvider.decodeToken(ctx.token) : ctx.token;
			const authToken = await tokenProvider.stepUpToken(existingAuthToken);
			if (!authToken)
				throw new AuthenticationError('Challenge unsuccessful: Token generation failed.');

			const token = Token.fromBackendEntity(authToken);
			if (!token) throw new AuthenticationError('Challenge unsuccessful.');

			return token;
		} catch (e: any) {
			if (e instanceof AuthenticationError) throw e;
			if (e instanceof ChallengeError) throw e;
			if (e instanceof ForbiddenError) throw e;

			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Passkey authentication failed.');
		}
	}
}
