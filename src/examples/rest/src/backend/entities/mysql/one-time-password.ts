import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { OTP as OTPInterface } from '@exogee/graphweaver-auth';

@Entity()
export class OneTimePassword extends BaseEntity implements OTPInterface {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	userId!: string;

	@Property({ type: String })
	code!: string;

	@Property({ type: Date })
	createdAt!: Date;

	@Property({ type: Date })
	redeemedAt?: Date;
}
