import { Field, GraphQLID, Entity, ReadOnly } from '@exogee/graphweaver';
import type {
	AuthenticatorAssertionResponseJSON,
	AuthenticationResponseJSON,
	AuthenticatorAttachment,
	AuthenticationExtensionsClientOutputs,
	PublicKeyCredentialType,
} from '@simplewebauthn/types';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@ReadOnly()
@Entity('PasskeyAuthenticationResponse')
export class PasskeyAuthenticationResponse implements AuthenticationResponseJSON {
	@Field(() => GraphQLID)
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
