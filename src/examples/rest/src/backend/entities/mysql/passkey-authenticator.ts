import { Uint8ArrayType, Entity, PrimaryKey, Property, BigIntType } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import type { PasskeyAuthenticatorDevice } from '@exogee/graphweaver-auth';

@Entity()
export class PasskeyAuthenticator extends BaseEntity implements PasskeyAuthenticatorDevice {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: Uint8ArrayType })
	credentialID!: Uint8Array;

	@Property({ type: String })
	userId!: string;

	@Property({ type: Uint8ArrayType })
	credentialPublicKey!: Uint8Array;

	@Property({ type: Number })
	counter!: number;
}
