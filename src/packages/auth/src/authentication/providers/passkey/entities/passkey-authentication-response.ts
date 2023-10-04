import { Field, InputType } from '@exogee/graphweaver';
import type {
	AuthenticatorAssertionResponseJSON,
	AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';

@InputType()
export class PasskeyAuthenticationResponse implements AuthenticationResponseJSON {
	@Field()
	id!: string;

	@Field()
	rawId!: string;

	@Field()
	response!: AuthenticatorAssertionResponseJSON;

	@Field({ nullable: true })
	authenticatorAttachment?: AuthenticatorAttachment;

	@Field()
	clientExtensionResults!: AuthenticationExtensionsClientOutputs;

	@Field()
	type!: PublicKeyCredentialType;
}
