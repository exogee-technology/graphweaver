import { BigIntType, Entity, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/core';

import { Task } from './task';

@Entity()
export class Tag {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	name!: string;

	@ManyToMany(() => Task, (task) => task.tags)
	tasks = new Collection<Task>(this);
}
