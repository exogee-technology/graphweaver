import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { AuthenticationError } from 'apollo-server-errors';

import { AuthenticationMethod, AuthorizationContext } from '../../../types';
import { AuthTokenProvider } from '../../token';
import { Token } from '../../schema/token';
import { UserProfile } from '../../../user-profile';

// Human-readable title for your website
const rpName = 'SimpleWebAuthn Example';
// A unique identifier for your website
const rpID = 'localhost';
// The URL at which registrations and authentications should occur
const origin = `https://${rpID}`;

type Authenticator = {
	id: Uint8Array;
	credentialPublicKey: Uint8Array;
	counter: number;
	credentialDeviceType?: string;
	credentialBackedUp?: boolean;
	transports?: AuthenticatorTransport[];
};

@Resolver((of) => Token)
export abstract class PasskeyAuthResolver {
	abstract getUserCurrentChallenge(userId: string): Promise<string>;
	abstract setUserCurrentChallenge(userId: string, challenge: string): Promise<boolean>;
	abstract getUserAuthenticators(userId: string): Promise<Authenticator[]>;
	abstract saveNewUserAuthenticator(
		userId: string,
		authenticator: Authenticator
	): Promise<Authenticator[]>;

	@Mutation(() => Token)
	async passkeyRegistration(
		@Ctx() ctx: AuthorizationContext
	): Promise<PublicKeyCredentialCreationOptions> {
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
				id: authenticator.id,
				type: 'public-key',
				transports: authenticator.transports,
			})),
		});

		await this.setUserCurrentChallenge(userId, options.challenge);

		return options as any;
	}

	@Mutation(() => Boolean)
	async passkeyVerifyRegistration(
		@Arg('registrationResponse', () => RegistrationResponse)
		registrationResponse: RegistrationResponse,
		@Ctx() ctx: AuthorizationContext
	): Promise<boolean> {
		const userId = ctx.user?.id;
		if (!userId) throw new AuthenticationError('Authentication failed.');

		const username = ctx.user?.username;
		if (!username) throw new AuthenticationError('Authentication failed.');

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
			if (!registrationInfo?.credentialPublicKey) throw new AuthenticationError('');
			if (!registrationInfo?.counter) throw new AuthenticationError('');

			const newAuthenticator: Authenticator = {
				id: registrationInfo.credentialID,
				credentialPublicKey: registrationInfo.credentialPublicKey,
				counter: registrationInfo.counter,
			};

			await this.saveNewUserAuthenticator(userId, newAuthenticator);
		}

		return verified;
	}
}
