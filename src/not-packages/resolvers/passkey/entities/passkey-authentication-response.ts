import { Field, ID, Entity } from '@exogee/graphweaver';
import type {
	AuthenticatorAssertionResponseJSON,
	AuthenticationResponseJSON,
	AuthenticatorAttachment,
	AuthenticationExtensionsClientOutputs,
	PublicKeyCredentialType,
} from '@simplewebauthn/types';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';

@Entity('PasskeyAuthenticationResponse', {
	adminUIOptions: {
		readonly: true,
	},
	apiOptions: {
		readonly: true,
	},
})
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
