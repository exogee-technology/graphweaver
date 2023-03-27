import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

@Entity()
export class Task extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	description!: string;

	@Property({ type: BigIntType })
	userId!: string;
}
