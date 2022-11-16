import {
	BigIntType,
	Collection,
	Entity,
	ManyToMany,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

import { Hobby } from './hobby';
import { Skill } from './skill';

@Entity()
export class User extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	name!: string;

	@OneToMany(() => Hobby, 'user')
	hobbies = new Collection<Hobby>(this);

	@ManyToMany(() => Skill)
	skills = new Collection<Skill>(this);
}
