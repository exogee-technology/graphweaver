import { BigIntType, Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Task } from './task';

@Entity({ tableName: 'tag' })
export class Tag {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({
		entity: () => Tag,
		pivotTable: 'task_tag',
		joinColumn: 'tag_id',
		inverseJoinColumn: 'task_id',
	})
	tasks = new Collection<Task>(this);
}
