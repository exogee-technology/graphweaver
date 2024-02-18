import { Field, ID, InputType } from '@exogee/graphweaver';
import type {
	AuthenticatorAttestationResponseJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@InputType()
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
