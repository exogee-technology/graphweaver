import { BigIntType, Entity, ManyToOne, PrimaryKey, Property, Reference } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

import { User } from '../../entities';

@Entity()
export class Hobby extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	name!: string;

	@ManyToOne(() => User)
	user!: Reference<User>;
}
