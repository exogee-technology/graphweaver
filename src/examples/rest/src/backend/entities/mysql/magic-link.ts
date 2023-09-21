import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { MagicLink as MagicLinkInterface } from '@exogee/graphweaver-auth';

@Entity()
export class MagicLink extends BaseEntity implements MagicLinkInterface {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	userId!: string;

	@Property({ type: String })
	token!: string;

	@Property({ type: Date })
	createdAt!: Date;

	@Property({ type: Date })
	redeemedAt?: Date;
}
