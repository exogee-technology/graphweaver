import { BigIntType, Entity, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

import { Task } from './task';

@Entity()
export class Fish extends BaseEntity {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	name!: string;

	@ManyToMany(() => Task, (task) => task.fish)
	tasks = new Collection<Task>(this);
}
