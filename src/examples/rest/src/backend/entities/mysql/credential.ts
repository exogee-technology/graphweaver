import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

@Entity()
export class Credential extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	password!: string;
}
