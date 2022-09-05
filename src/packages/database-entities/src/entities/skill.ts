import { BigIntType, Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from './base-entity';
import { User } from './user';

@Entity()
export class Skill extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	name!: string;

	@ManyToMany({ entity: () => User, mappedBy: 'skills'})
	users = new Collection<User>(this);
}
