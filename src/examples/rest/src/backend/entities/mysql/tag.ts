import { BigIntType, Entity, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

import { Task } from './task';

@Entity()
export class Tag extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	name!: string;

	@ManyToMany(() => Task, (task) => task.tags)
	tasks = new Collection<Task>(this);
}
