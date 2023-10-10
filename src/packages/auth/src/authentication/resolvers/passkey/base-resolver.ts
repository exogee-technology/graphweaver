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
import { Token } from '../../entities/token';
import { PasskeyRegistrationResponse, PasskeyAuthenticationResponse } from './entities';
import { AuthTokenProvider } from '../../token';
import { ChallengeError } from '../../../errors';

export type { AuthenticatorTransportFuture as PasskeyAuthenticatorTransportFuture } from '@simplewebauthn/typescript-types';

export interface PasskeyAuthenticatorDevice {
	id: string;
	credentialPublicKey: string;
	credentialID: string;
	counter: number;
}

const config = {
	rp: {
		name: process.env.AUTH_PASSKEY_RELYING_PARTY_NAME ?? 'Graphweaver',
		id: process.env.AUTH_PASSKEY_RELYING_PARTY_ID || 'localhost',
	},
	origin: process.env.AUTH_PASSKEY_ORIGIN || 'http://localhost:9000',
};

@Resolver((of) => Token)
export abstract class BasePasskeyAuthResolver {
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
		if (!ctx.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

		const userId = ctx.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const username = ctx.user?.username;
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

	@Mutation(() => Boolean)
	async passkeyVerifyRegistrationResponse(
		@Arg('registrationResponse', () => PasskeyRegistrationResponse)
		registrationResponse: PasskeyRegistrationResponse,
		@Ctx() ctx: AuthorizationContext
	): Promise<boolean> {
		try {
			if (!ctx.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = ctx.user?.id;
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

			logger.info('Authentication failed with error', e);
			throw new AuthenticationError('Passkey authentication failed.');
		}
	}

	@Mutation(() => GraphQLJSON)
	async passkeyGenerateAuthenticationOptions(
		@Ctx() ctx: AuthorizationContext
	): Promise<PublicKeyCredentialRequestOptionsJSON> {
		if (!ctx.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

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

		// Remember this challenge for this user
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
			if (!ctx.token) throw new ForbiddenError('Challenge unsuccessful: Token missing.');

			const userId = ctx.user?.id;
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
