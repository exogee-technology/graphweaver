import { Field, GraphQLID, Entity } from '@exogee/graphweaver';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import type {
	AuthenticationExtensionsClientOutputs,
	AuthenticatorAttachment,
	AuthenticatorAttestationResponseJSON,
	PublicKeyCredentialType,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';

@Entity('PasskeyRegistrationResponse')
export class PasskeyRegistrationResponse implements RegistrationResponseJSON {
	@Field(() => GraphQLID)
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
