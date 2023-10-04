import { Field, InputType } from '@exogee/graphweaver';
import type {
	AuthenticatorAttestationResponseJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';

@InputType()
export class PasskeyRegistrationResponse implements RegistrationResponseJSON {
	@Field()
	id!: string;

	@Field()
	rawId!: string;

	@Field()
	response!: AuthenticatorAttestationResponseJSON;

	@Field({ nullable: true })
	authenticatorAttachment?: AuthenticatorAttachment;

	@Field()
	clientExtensionResults!: AuthenticationExtensionsClientOutputs;

	@Field()
	type!: PublicKeyCredentialType;
}
