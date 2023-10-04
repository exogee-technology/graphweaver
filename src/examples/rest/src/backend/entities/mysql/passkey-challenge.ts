import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { OTP as OTPInterface } from '@exogee/graphweaver-auth';

@Entity()
export class PasskeyChallenge extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	userId!: string;

	@Property({ type: String })
	challenge!: string;
}
