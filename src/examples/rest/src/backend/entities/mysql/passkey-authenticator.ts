import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import type {
	PasskeyAuthenticatorDevice,
	PasskeyAuthenticatorTransportFuture,
} from '@exogee/graphweaver-auth';

@Entity()
export class PasskeyAuthenticator extends BaseEntity implements PasskeyAuthenticatorDevice {
	@PrimaryKey({ type: BigIntType })
	credentialID!: Uint8Array;

	@Property({ type: BigIntType })
	credentialPublicKey!: Uint8Array;

	@Property({ type: Number })
	counter!: number;

	@Property({ type: String })
	transports?: PasskeyAuthenticatorTransportFuture[];
}
