import { Field, InputType, ID } from '@exogee/graphweaver';
import type {
	AuthenticatorAssertionResponseJSON,
	AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@InputType()
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
